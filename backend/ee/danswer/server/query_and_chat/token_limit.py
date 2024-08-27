from collections import defaultdict
from collections.abc import Sequence
from datetime import datetime
from itertools import groupby
from typing import Dict
from typing import List
from typing import Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session

from danswer.db.engine import get_session_context_manager
from danswer.db.models import ChatMessage
from danswer.db.models import ChatSession
from danswer.db.models import Teamspace
from danswer.db.models import TokenRateLimit
from danswer.db.models import TokenRateLimit__Teamspace
from danswer.db.models import User
from danswer.db.models import User__Teamspace
from danswer.server.query_and_chat.token_limit import _get_cutoff_time
from danswer.server.query_and_chat.token_limit import _is_rate_limited
from danswer.server.query_and_chat.token_limit import _user_is_rate_limited_by_global
from danswer.utils.threadpool_concurrency import run_functions_tuples_in_parallel
from ee.danswer.db.api_key import is_api_key_email_address
from ee.danswer.db.token_limit import fetch_all_user_token_rate_limits


def _check_token_rate_limits(user: User | None) -> None:
    if user is None:
        # Unauthenticated users are only rate limited by global settings
        _user_is_rate_limited_by_global()

    elif is_api_key_email_address(user.email):
        # API keys are only rate limited by global settings
        _user_is_rate_limited_by_global()

    else:
        run_functions_tuples_in_parallel(
            [
                (_user_is_rate_limited, (user.id,)),
                (_user_is_rate_limited_by_teamspace, (user.id,)),
                (_user_is_rate_limited_by_global, ()),
            ]
        )


"""
User rate limits
"""


def _user_is_rate_limited(user_id: UUID) -> None:
    with get_session_context_manager() as db_session:
        user_rate_limits = fetch_all_user_token_rate_limits(
            db_session=db_session, enabled_only=True, ordered=False
        )

        if user_rate_limits:
            user_cutoff_time = _get_cutoff_time(user_rate_limits)
            user_usage = _fetch_user_usage(user_id, user_cutoff_time, db_session)

            if _is_rate_limited(user_rate_limits, user_usage):
                raise HTTPException(
                    status_code=429,
                    detail="Token budget exceeded for user. Try again later.",
                )


def _fetch_user_usage(
    user_id: UUID, cutoff_time: datetime, db_session: Session
) -> Sequence[tuple[datetime, int]]:
    """
    Fetch user usage within the cutoff time, grouped by minute
    """
    result = db_session.execute(
        select(
            func.date_trunc("minute", ChatMessage.time_sent),
            func.sum(ChatMessage.token_count),
        )
        .join(ChatSession, ChatMessage.chat_session_id == ChatSession.id)
        .where(ChatSession.user_id == user_id, ChatMessage.time_sent >= cutoff_time)
        .group_by(func.date_trunc("minute", ChatMessage.time_sent))
    ).all()

    return [(row[0], row[1]) for row in result]


"""
Teamspace rate limits
"""


def _user_is_rate_limited_by_teamspace(user_id: UUID) -> None:
    with get_session_context_manager() as db_session:
        teamspace_rate_limits = _fetch_all_teamspace_rate_limits(user_id, db_session)

        if teamspace_rate_limits:
            # Group cutoff time is the same for all teamspaces.
            # This could be optimized to only fetch the maximum cutoff time for
            # a specific group, but seems unnecessary for now.
            teamspace_cutoff_time = _get_cutoff_time(
                [e for sublist in teamspace_rate_limits.values() for e in sublist]
            )

            teamspace_ids = list(teamspace_rate_limits.keys())
            teamspace_usage = _fetch_teamspace_usage(
                teamspace_ids, teamspace_cutoff_time, db_session
            )

            has_at_least_one_untriggered_limit = False
            for teamspace_id, rate_limits in teamspace_rate_limits.items():
                usage = teamspace_usage.get(teamspace_id, [])

                if not _is_rate_limited(rate_limits, usage):
                    has_at_least_one_untriggered_limit = True
                    break

            if not has_at_least_one_untriggered_limit:
                raise HTTPException(
                    status_code=429,
                    detail="Token budget exceeded for user's teamspaces. Try again later.",
                )


def _fetch_all_teamspace_rate_limits(
    user_id: UUID, db_session: Session
) -> Dict[int, List[TokenRateLimit]]:
    teamspace_limits = (
        select(TokenRateLimit, User__Teamspace.teamspace_id)
        .join(
            TokenRateLimit__Teamspace,
            TokenRateLimit.id == TokenRateLimit__Teamspace.rate_limit_id,
        )
        .join(
            Teamspace,
            Teamspace.id == TokenRateLimit__Teamspace.teamspace_id,
        )
        .join(
            User__Teamspace,
            User__Teamspace.teamspace_id == Teamspace.id,
        )
        .where(
            User__Teamspace.user_id == user_id,
            TokenRateLimit.enabled.is_(True),
        )
    )

    raw_rate_limits = db_session.execute(teamspace_limits).all()

    teamspace_rate_limits = defaultdict(list)
    for rate_limit, teamspace_id in raw_rate_limits:
        teamspace_rate_limits[teamspace_id].append(rate_limit)

    return teamspace_rate_limits


def _fetch_teamspace_usage(
    teamspace_ids: list[int], cutoff_time: datetime, db_session: Session
) -> dict[int, list[Tuple[datetime, int]]]:
    """
    Fetch teamspace usage within the cutoff time, grouped by minute
    """
    teamspace_usage = db_session.execute(
        select(
            func.sum(ChatMessage.token_count),
            func.date_trunc("minute", ChatMessage.time_sent),
            Teamspace.id,
        )
        .join(ChatSession, ChatMessage.chat_session_id == ChatSession.id)
        .join(User__Teamspace, User__Teamspace.user_id == ChatSession.user_id)
        .join(Teamspace, Teamspace.id == User__Teamspace.teamspace_id)
        .filter(Teamspace.id.in_(teamspace_ids), ChatMessage.time_sent >= cutoff_time)
        .group_by(func.date_trunc("minute", ChatMessage.time_sent), Teamspace.id)
    ).all()

    return {
        teamspace_id: [(usage, time_sent) for time_sent, usage, _ in teamspace_usage]
        for teamspace_id, teamspace_usage in groupby(
            teamspace_usage, key=lambda row: row[2]
        )
    }
