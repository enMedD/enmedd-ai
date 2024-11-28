from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import inspect
from sqlalchemy import select
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ee.enmedd.server.workspace.models import UserRole
from ee.enmedd.server.workspace.models import UserWithRole
from ee.enmedd.server.workspace.models import WorkspaceCreate
from enmedd.db.enums import InstanceSubscriptionPlan
from enmedd.db.models import Instance


def create_new_schema(db_session: Session, schema_name: str) -> None:
    """Create a new schema in the database."""
    db_session.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
    db_session.commit()


def fetch_all_schemas(db_session: Session):
    """Fetch all schemas from the database."""
    result = db_session.execute(
        text(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')"
        )
    ).fetchall()

    schemas = [row[0] for row in result]
    return schemas


def migrate_public_schema_to_new_schema(db_session: Session, schema_name: str) -> None:
    """Migrate the table structures from the public schema to a new schema."""

    db_session.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name};"))

    inspector = inspect(db_session.bind)
    public_tables = inspector.get_table_names(schema="public")

    for table_name in public_tables:
        db_session.execute(
            text(
                f"""
            CREATE TABLE IF NOT EXISTS {schema_name}.{table_name}
            (LIKE public.{table_name} INCLUDING ALL);
        """
            )
        )

    db_session.commit()


def delete_schema(db_session: Session, schema_name: str) -> None:
    """Delete the schema from the database."""
    db_session.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
    db_session.commit()


def copy_filtered_data(db_session: Session, schema_name: str) -> None:
    """Copy filtered data based on specified rules from public to new schema."""

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.prompt
            SELECT * FROM public.prompt
            WHERE default_prompt = true;
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.llm_provider
            SELECT * FROM public.llm_provider
            WHERE is_default_provider = true;
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.key_value_store
            SELECT * FROM public.key_value_store
            WHERE key = 'enmedd_feature_flag';
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.inputprompt
            SELECT * FROM public.inputprompt
            WHERE id < 0;
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.assistant
            SELECT * FROM public.assistant
            WHERE id BETWEEN -2147483648 AND 0;
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.tool
            SELECT * FROM public.tool
            WHERE id BETWEEN 1 AND 3;
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.search_settings
            SELECT * FROM public.search_settings
            WHERE id BETWEEN 1 AND 2;
        """
        )
    )

    db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.instance
            SELECT * FROM public.instance;
        """
        )
    )

    db_session.commit()


def insert_workspace_data(
    db_session: Session, schema_name: str, workspace: WorkspaceCreate
) -> int:
    """Insert workspace data into the new schema's workspace table and return workspace_id."""
    result = db_session.execute(
        text(
            f"""
            INSERT INTO {schema_name}.workspace (
                id, instance_id, workspace_name, workspace_description, use_custom_logo,
                custom_logo, custom_header_logo, custom_header_content,
                brand_color, secondary_color
            ) VALUES (
                0, :instance_id, :workspace_name, :workspace_description, :use_custom_logo,
                :custom_logo, :custom_header_logo, :custom_header_content,
                :brand_color, :secondary_color
            )
            RETURNING id  -- Assuming `id` is the primary key column for the workspace table
        """
        ),
        {
            "instance_id": 0,  # Adjust as needed
            "workspace_name": workspace.workspace_name,
            "workspace_description": workspace.workspace_description,
            "use_custom_logo": workspace.use_custom_logo,
            "custom_logo": workspace.custom_logo,
            "custom_header_logo": workspace.custom_header_logo,
            "custom_header_content": workspace.custom_header_content,
            "brand_color": workspace.brand_color,
            "secondary_color": workspace.secondary_color,
        },
    )
    workspace_id = result.scalar()
    db_session.commit()
    return workspace_id


def copy_users_to_new_schema(
    db_session: Session, schema_name: str, users: List[UserWithRole]
):
    user_ids = [user.user_id for user in users]
    user_ids_placeholder = ", ".join([f"'{str(uid)}'" for uid in user_ids])

    copy_query = text(
        f"""
        INSERT INTO {schema_name}.user
        SELECT * FROM public.user
        WHERE id IN ({user_ids_placeholder});
    """
    )

    try:
        db_session.execute(copy_query)

        for user in users:
            role = (user.role or UserRole.BASIC).upper()
            update_query = text(
                f"""
                UPDATE {schema_name}.user
                SET role = :role
                WHERE id = :user_id;
            """
            )
            db_session.execute(
                update_query, {"role": role, "user_id": str(user.user_id)}
            )

        db_session.commit()

    except Exception as e:
        db_session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to copy user data: {str(e)}",
        )


def upsert_instance(
    db_session: Session,
    id: int,
    instance_name: str,
    subscription_plan: InstanceSubscriptionPlan
    | None = InstanceSubscriptionPlan.ENTERPRISE,
    owner_id: UUID | None = None,
    commit: bool = True,
) -> Instance:
    try:
        # Check if the instance already exists
        instance = db_session.scalar(select(Instance).where(Instance.id == id))

        if instance:
            # Update existing instance
            instance.instance_name = instance_name
            instance.subscription_plan = subscription_plan
            instance.owner_id = owner_id
        else:
            # Create new instance
            instance = Instance(
                id=id,
                instance_name=instance_name,
                subscription_plan=subscription_plan,
                owner_id=owner_id,
            )
            db_session.add(instance)

        if commit:
            db_session.commit()
        else:
            # Flush the session so that the Prompt has an ID
            db_session.flush()

        return instance

    except SQLAlchemyError as e:
        # Roll back the changes in case of an error
        db_session.rollback()
        raise Exception(f"Error upserting instance: {str(e)}") from e
