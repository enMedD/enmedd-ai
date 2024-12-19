import os
import subprocess
from datetime import datetime
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
from enmedd.configs.app_configs import POSTGRES_DB
from enmedd.configs.app_configs import POSTGRES_HOST
from enmedd.configs.app_configs import POSTGRES_PASSWORD
from enmedd.configs.app_configs import POSTGRES_PORT
from enmedd.configs.app_configs import POSTGRES_USER
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
    """Migrate the table structures and constraints from the public schema to a new schema."""

    db_session.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name};"))

    try:
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

        for table_name in public_tables:
            foreign_keys = inspector.get_foreign_keys(table_name, schema="public")
            for fk in foreign_keys:
                fk_columns = ", ".join(fk["constrained_columns"])
                ref_table = fk["referred_table"]
                ref_columns = ", ".join(fk["referred_columns"])
                on_delete = fk["options"].get("ondelete", "NO ACTION")
                on_update = fk["options"].get("onupdate", "NO ACTION")

                ref_table_new_schema = f"{schema_name}.{ref_table}"

                db_session.execute(
                    text(
                        f"""
                        ALTER TABLE {schema_name}.{table_name}
                        ADD CONSTRAINT {fk['name']}
                        FOREIGN KEY ({fk_columns})
                        REFERENCES {ref_table_new_schema}({ref_columns})
                        ON DELETE {on_delete}
                        ON UPDATE {on_update};
                    """
                    )
                )

        db_session.commit()

    except Exception as e:
        db_session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to migrate public schema to new schema: {str(e)}",
        )


def delete_schema(db_session: Session, schema_name: str) -> None:
    """Delete the schema from the database."""
    db_session.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
    db_session.commit()


def copy_filtered_data(db_session: Session, schema_name: str) -> None:
    """Copy filtered data based on specified rules from public to new schema."""

    try:
        db_session.execute(
            text(
                f"""
                INSERT INTO {schema_name}.prompt
                SELECT * FROM public.prompt
                WHERE user_id = null;
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
                WHERE user_id = null;
            """
            )
        )

        db_session.execute(
            text(
                f"""
                INSERT INTO {schema_name}.assistant
                SELECT * FROM public.assistant
                WHERE user_id = null;
            """
            )
        )

        db_session.execute(
            text(
                f"""
                INSERT INTO {schema_name}.assistant__prompt
                SELECT * FROM public.assistant__prompt
                WHERE assistant_id BETWEEN -2147483648 AND 0;
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
                INSERT INTO {schema_name}.assistant__tool
                SELECT * FROM public.assistant__tool
                WHERE assistant_id BETWEEN -2147483648 AND 0;
            """
            )
        )

        db_session.execute(
            text(
                f"""
                INSERT INTO {schema_name}.connector
                SELECT * FROM public.connector
                WHERE id = 0;
            """
            )
        )

        db_session.execute(
            text(
                f"""
                INSERT INTO {schema_name}.credential
                SELECT * FROM public.credential
                WHERE id = 0;
            """
            )
        )

        db_session.execute(
            text(
                f"""
                INSERT INTO {schema_name}.connector_credential_pair
                SELECT * FROM public.connector_credential_pair
                WHERE connector_id = 0 AND credential_id = 0;
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

    except Exception as e:
        db_session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to copy filtered data: {str(e)}",
        )


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


def backup_schema(
    schema_name: str,
    backup_directory: str,
    db_session: Session,
) -> str:
    backup_file = os.path.join(
        backup_directory,
        f"{schema_name}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.dump",
    )
    # backup_file = f"/tmp/{request.schema_name}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.dump"

    schema_exists_query = text(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schema_name"
    )
    result = db_session.execute(schema_exists_query, {"schema_name": schema_name})
    schema_exists = result.scalar()

    if not schema_exists:
        raise HTTPException(
            status_code=404, detail=f"Schema '{schema_name}' does not exist."
        )

    pg_dump_command = [
        "pg_dump",
        "-U",
        POSTGRES_USER,
        "-h",
        POSTGRES_HOST,
        "-p",
        POSTGRES_PORT,
        "-F",
        "c",
        "-d",
        POSTGRES_DB,
        "-n",
        schema_name,
        "-f",
        backup_file,
    ]

    process = subprocess.run(
        pg_dump_command,
        text=True,
        capture_output=True,
        env={"PGPASSWORD": POSTGRES_PASSWORD},
    )

    if process.returncode != 0:
        raise HTTPException(
            status_code=500, detail=f"Backup failed: {process.stderr.strip()}"
        )

    # Store the backup in the PGFileStore
    # file_store = get_default_file_store(db_session)

    # with open(backup_file, "rb") as content:
    #     file_store.save_file(
    #         file_name=f"{request.schema_name}_backup",
    #         content=content,
    #         display_name=f"Backup for schema {request.schema_name}",
    #         file_origin=FileOrigin.SCHEMA_BACKUP,
    #         file_type="application/octet-stream",
    #         file_metadata={"schema_name": request.schema_name}
    #     )

    return backup_file


def rename_schema(
    schema_name: str,
    renamed_schema: str,
    db_session: Session,
) -> None:
    rename_schema_query = text(f"ALTER SCHEMA {schema_name} RENAME TO {renamed_schema}")
    db_session.execute(rename_schema_query)
    db_session.commit()
