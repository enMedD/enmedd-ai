from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from enmedd.auth.users import current_admin_user
from enmedd.enmedddbot.slack.config import validate_channel_names
from enmedd.enmedddbot.slack.tokens import fetch_tokens
from enmedd.enmedddbot.slack.tokens import save_tokens
from enmedd.db.constants import SLACK_BOT_PERSONA_PREFIX
from enmedd.db.engine import get_session
from enmedd.db.models import ChannelConfig
from enmedd.db.models import User
from enmedd.db.assistant import get_assistant_by_id
from enmedd.db.slack_bot_config import create_slack_bot_assistant
from enmedd.db.slack_bot_config import fetch_slack_bot_config
from enmedd.db.slack_bot_config import fetch_slack_bot_configs
from enmedd.db.slack_bot_config import insert_slack_bot_config
from enmedd.db.slack_bot_config import remove_slack_bot_config
from enmedd.db.slack_bot_config import update_slack_bot_config
from enmedd.key_value_store.interface import KvKeyNotFoundError
from enmedd.server.manage.models import SlackBotConfig
from enmedd.server.manage.models import SlackBotConfigCreationRequest
from enmedd.server.manage.models import SlackBotTokens


router = APIRouter(prefix="/manage")


def _form_channel_config(
    slack_bot_config_creation_request: SlackBotConfigCreationRequest,
    current_slack_bot_config_id: int | None,
    db_session: Session,
) -> ChannelConfig:
    raw_channel_names = slack_bot_config_creation_request.channel_names
    respond_tag_only = slack_bot_config_creation_request.respond_tag_only
    respond_member_group_list = (
        slack_bot_config_creation_request.respond_member_group_list
    )
    answer_filters = slack_bot_config_creation_request.answer_filters
    follow_up_tags = slack_bot_config_creation_request.follow_up_tags

    if not raw_channel_names:
        raise HTTPException(
            status_code=400,
            detail="Must provide at least one channel name",
        )

    try:
        cleaned_channel_names = validate_channel_names(
            channel_names=raw_channel_names,
            current_slack_bot_config_id=current_slack_bot_config_id,
            db_session=db_session,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    if respond_tag_only and respond_member_group_list:
        raise ValueError(
            "Cannot set DanswerBot to only respond to tags only and "
            "also respond to a predetermined set of users."
        )

    channel_config: ChannelConfig = {
        "channel_names": cleaned_channel_names,
    }
    if respond_tag_only is not None:
        channel_config["respond_tag_only"] = respond_tag_only
    if respond_member_group_list:
        channel_config["respond_member_group_list"] = respond_member_group_list
    if answer_filters:
        channel_config["answer_filters"] = answer_filters
    if follow_up_tags is not None:
        channel_config["follow_up_tags"] = follow_up_tags

    channel_config[
        "respond_to_bots"
    ] = slack_bot_config_creation_request.respond_to_bots

    return channel_config


@router.post("/admin/slack-bot/config")
def create_slack_bot_config(
    slack_bot_config_creation_request: SlackBotConfigCreationRequest,
    db_session: Session = Depends(get_session),
    _: User | None = Depends(current_admin_user),
) -> SlackBotConfig:
    channel_config = _form_channel_config(
        slack_bot_config_creation_request, None, db_session
    )

    assistant_id = None
    if slack_bot_config_creation_request.assistant_id is not None:
        assistant_id = slack_bot_config_creation_request.assistant_id
    elif slack_bot_config_creation_request.document_sets:
        assistant_id = create_slack_bot_assistant(
            db_session=db_session,
            channel_names=channel_config["channel_names"],
            document_set_ids=slack_bot_config_creation_request.document_sets,
            existing_assistant_id=None,
        ).id

    slack_bot_config_model = insert_slack_bot_config(
        assistant_id=assistant_id,
        channel_config=channel_config,
        response_type=slack_bot_config_creation_request.response_type,
        # XXX this is going away soon
        standard_answer_category_ids=slack_bot_config_creation_request.standard_answer_categories,
        db_session=db_session,
        enable_auto_filters=slack_bot_config_creation_request.enable_auto_filters,
    )
    return SlackBotConfig.from_model(slack_bot_config_model)


@router.patch("/admin/slack-bot/config/{slack_bot_config_id}")
def patch_slack_bot_config(
    slack_bot_config_id: int,
    slack_bot_config_creation_request: SlackBotConfigCreationRequest,
    db_session: Session = Depends(get_session),
    _: User | None = Depends(current_admin_user),
) -> SlackBotConfig:
    channel_config = _form_channel_config(
        slack_bot_config_creation_request, slack_bot_config_id, db_session
    )

    assistant_id = None
    if slack_bot_config_creation_request.assistant_id is not None:
        assistant_id = slack_bot_config_creation_request.assistant_id
    elif slack_bot_config_creation_request.document_sets:
        existing_slack_bot_config = fetch_slack_bot_config(
            db_session=db_session, slack_bot_config_id=slack_bot_config_id
        )
        if existing_slack_bot_config is None:
            raise HTTPException(
                status_code=404,
                detail="Slack bot config not found",
            )

        existing_assistant_id = existing_slack_bot_config.assistant_id
        if existing_assistant_id is not None:
            assistant = get_assistant_by_id(
                assistant_id=existing_assistant_id,
                user=None,
                db_session=db_session,
                is_for_edit=False,
            )

            if not assistant.name.startswith(SLACK_BOT_PERSONA_PREFIX):
                # Don't update actual non-slackbot specific assistants
                # Since this one specified document sets, we have to create a new assistant
                # for this DanswerBot config
                existing_assistant_id = None
            else:
                existing_assistant_id = existing_slack_bot_config.assistant_id

        assistant_id = create_slack_bot_assistant(
            db_session=db_session,
            channel_names=channel_config["channel_names"],
            document_set_ids=slack_bot_config_creation_request.document_sets,
            existing_assistant_id=existing_assistant_id,
            enable_auto_filters=slack_bot_config_creation_request.enable_auto_filters,
        ).id

    slack_bot_config_model = update_slack_bot_config(
        slack_bot_config_id=slack_bot_config_id,
        assistant_id=assistant_id,
        channel_config=channel_config,
        response_type=slack_bot_config_creation_request.response_type,
        standard_answer_category_ids=slack_bot_config_creation_request.standard_answer_categories,
        db_session=db_session,
        enable_auto_filters=slack_bot_config_creation_request.enable_auto_filters,
    )
    return SlackBotConfig.from_model(slack_bot_config_model)


@router.delete("/admin/slack-bot/config/{slack_bot_config_id}")
def delete_slack_bot_config(
    slack_bot_config_id: int,
    db_session: Session = Depends(get_session),
    user: User | None = Depends(current_admin_user),
) -> None:
    remove_slack_bot_config(
        slack_bot_config_id=slack_bot_config_id, user=user, db_session=db_session
    )


@router.get("/admin/slack-bot/config")
def list_slack_bot_configs(
    db_session: Session = Depends(get_session),
    _: User | None = Depends(current_admin_user),
) -> list[SlackBotConfig]:
    slack_bot_config_models = fetch_slack_bot_configs(db_session=db_session)
    return [
        SlackBotConfig.from_model(slack_bot_config_model)
        for slack_bot_config_model in slack_bot_config_models
    ]


@router.put("/admin/slack-bot/tokens")
def put_tokens(
    tokens: SlackBotTokens,
    _: User | None = Depends(current_admin_user),
) -> None:
    save_tokens(tokens=tokens)


@router.get("/admin/slack-bot/tokens")
def get_tokens(_: User | None = Depends(current_admin_user)) -> SlackBotTokens:
    try:
        return fetch_tokens()
    except KvKeyNotFoundError:
        raise HTTPException(status_code=404, detail="No tokens found")
