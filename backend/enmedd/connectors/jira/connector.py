import os
from datetime import datetime
from datetime import timezone
from typing import Any
from urllib.parse import urlparse

from jira import JIRA
from jira.resources import Issue

from enmedd.configs.app_configs import INDEX_BATCH_SIZE
from enmedd.configs.app_configs import JIRA_CONNECTOR_LABELS_TO_SKIP
from enmedd.configs.app_configs import JIRA_CONNECTOR_MAX_TICKET_SIZE
from enmedd.configs.constants import DocumentSource
from enmedd.connectors.cross_connector_utils.miscellaneous_utils import time_str_to_utc
from enmedd.connectors.interfaces import GenerateDocumentsOutput
from enmedd.connectors.interfaces import LoadConnector
from enmedd.connectors.interfaces import PollConnector
from enmedd.connectors.interfaces import SecondsSinceUnixEpoch
from enmedd.connectors.models import BasicExpertInfo
from enmedd.connectors.models import ConnectorMissingCredentialError
from enmedd.connectors.models import Document
from enmedd.connectors.models import Section
from enmedd.utils.logger import setup_logger


logger = setup_logger()
PROJECT_URL_PAT = "projects"
JIRA_API_VERSION = os.environ.get("JIRA_API_VERSION") or "2"


def extract_jira_project(url: str) -> tuple[str, str]:
    parsed_url = urlparse(url)
    jira_base = parsed_url.scheme + "://" + parsed_url.netloc

    # Split the path by '/' and find the position of 'projects' to get the project name
    split_path = parsed_url.path.split("/")
    if PROJECT_URL_PAT in split_path:
        project_pos = split_path.index(PROJECT_URL_PAT)
        if len(split_path) > project_pos + 1:
            jira_project = split_path[project_pos + 1]
        else:
            raise ValueError("No project name found in the URL")
    else:
        raise ValueError("'projects' not found in the URL")

    return jira_base, jira_project


def extract_text_from_adf(adf: dict | None) -> str:
    """Extracts plain text from Atlassian Document Format:
    https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/

    WARNING: This function is incomplete and will e.g. skip lists!
    """
    texts = []
    if adf is not None and "content" in adf:
        for block in adf["content"]:
            if "content" in block:
                for item in block["content"]:
                    if item["type"] == "text":
                        texts.append(item["text"])
    return " ".join(texts)


def best_effort_get_field_from_issue(jira_issue: Issue, field: str) -> Any:
    if hasattr(jira_issue.fields, field):
        return getattr(jira_issue.fields, field)

    try:
        return jira_issue.raw["fields"][field]
    except Exception:
        return None


def _get_comment_strs(
    jira: Issue, comment_email_blacklist: tuple[str, ...] = ()
) -> list[str]:
    comment_strs = []
    for comment in jira.fields.comment.comments:
        try:
            body_text = (
                comment.body
                if JIRA_API_VERSION == "2"
                else extract_text_from_adf(comment.raw["body"])
            )

            if (
                hasattr(comment, "author")
                and hasattr(comment.author, "emailAddress")
                and comment.author.emailAddress in comment_email_blacklist
            ):
                continue  # Skip adding comment if author's email is in blacklist

            comment_strs.append(body_text)
        except Exception as e:
            logger.error(f"Failed to process comment due to an error: {e}")
            continue

    return comment_strs


def fetch_jira_issues_batch(
    jql: str,
    start_index: int,
    jira_client: JIRA,
    batch_size: int = INDEX_BATCH_SIZE,
    comment_email_blacklist: tuple[str, ...] = (),
    labels_to_skip: set[str] | None = None,
) -> tuple[list[Document], int]:
    doc_batch = []

    batch = jira_client.search_issues(
        jql,
        startAt=start_index,
        maxResults=batch_size,
    )

    for jira in batch:
        if type(jira) != Issue:
            logger.warning(f"Found Jira object not of type Issue {jira}")
            continue

        if labels_to_skip and any(
            label in jira.fields.labels for label in labels_to_skip
        ):
            logger.info(
                f"Skipping {jira.key} because it has a label to skip. Found "
                f"labels: {jira.fields.labels}. Labels to skip: {labels_to_skip}."
            )
            continue

        description = (
            jira.fields.description
            if JIRA_API_VERSION == "2"
            else extract_text_from_adf(jira.raw["fields"]["description"])
        )
        comments = _get_comment_strs(jira, comment_email_blacklist)
        ticket_content = f"{description}\n" + "\n".join(
            [f"Comment: {comment}" for comment in comments if comment]
        )

        # Check ticket size
        if len(ticket_content.encode("utf-8")) > JIRA_CONNECTOR_MAX_TICKET_SIZE:
            logger.info(
                f"Skipping {jira.key} because it exceeds the maximum size of "
                f"{JIRA_CONNECTOR_MAX_TICKET_SIZE} bytes."
            )
            continue

        page_url = f"{jira_client.client_info()}/browse/{jira.key}"

        people = set()
        try:
            people.add(
                BasicExpertInfo(
                    display_name=jira.fields.creator.displayName,
                    email=jira.fields.creator.emailAddress,
                )
            )
        except Exception:
            # Author should exist but if not, doesn't matter
            pass

        try:
            people.add(
                BasicExpertInfo(
                    display_name=jira.fields.assignee.displayName,  # type: ignore
                    email=jira.fields.assignee.emailAddress,  # type: ignore
                )
            )
        except Exception:
            # Author should exist but if not, doesn't matter
            pass

        metadata_dict = {}
        priority = best_effort_get_field_from_issue(jira, "priority")
        if priority:
            metadata_dict["priority"] = priority.name
        status = best_effort_get_field_from_issue(jira, "status")
        if status:
            metadata_dict["status"] = status.name
        resolution = best_effort_get_field_from_issue(jira, "resolution")
        if resolution:
            metadata_dict["resolution"] = resolution.name
        labels = best_effort_get_field_from_issue(jira, "labels")
        if labels:
            metadata_dict["label"] = labels

        doc_batch.append(
            Document(
                id=page_url,
                sections=[Section(link=page_url, text=ticket_content)],
                source=DocumentSource.JIRA,
                semantic_identifier=jira.fields.summary,
                doc_updated_at=time_str_to_utc(jira.fields.updated),
                primary_owners=list(people) or None,
                # TODO add secondary_owners (commenters) if needed
                metadata=metadata_dict,
            )
        )
    return doc_batch, len(batch)


class JiraConnector(LoadConnector, PollConnector):
    def __init__(
        self,
        jira_project_url: str,
        comment_email_blacklist: list[str] | None = None,
        batch_size: int = INDEX_BATCH_SIZE,
        # if a ticket has one of the labels specified in this list, we will just
        # skip it. This is generally used to avoid indexing extra sensitive
        # tickets.
        labels_to_skip: list[str] = JIRA_CONNECTOR_LABELS_TO_SKIP,
    ) -> None:
        self.batch_size = batch_size
        self.jira_base, self.jira_project = extract_jira_project(jira_project_url)
        self.jira_client: JIRA | None = None
        self._comment_email_blacklist = comment_email_blacklist or []

        self.labels_to_skip = set(labels_to_skip)

    @property
    def comment_email_blacklist(self) -> tuple:
        return tuple(email.strip() for email in self._comment_email_blacklist)

    def load_credentials(self, credentials: dict[str, Any]) -> dict[str, Any] | None:
        api_token = credentials["jira_api_token"]
        # if user provide an email we assume it's cloud
        if "jira_user_email" in credentials:
            email = credentials["jira_user_email"]
            self.jira_client = JIRA(
                basic_auth=(email, api_token),
                server=self.jira_base,
                options={"rest_api_version": JIRA_API_VERSION},
            )
        else:
            self.jira_client = JIRA(
                token_auth=api_token,
                server=self.jira_base,
                options={"rest_api_version": JIRA_API_VERSION},
            )
        return None

    def load_from_state(self) -> GenerateDocumentsOutput:
        if self.jira_client is None:
            raise ConnectorMissingCredentialError("Jira")

        # Quote the project name to handle reserved words
        quoted_project = f'"{self.jira_project}"'
        start_ind = 0
        while True:
            doc_batch, fetched_batch_size = fetch_jira_issues_batch(
                jql=f"project = {quoted_project}",
                start_index=start_ind,
                jira_client=self.jira_client,
                batch_size=self.batch_size,
                comment_email_blacklist=self.comment_email_blacklist,
                labels_to_skip=self.labels_to_skip,
            )

            if doc_batch:
                yield doc_batch

            start_ind += fetched_batch_size
            if fetched_batch_size < self.batch_size:
                break

    def poll_source(
        self, start: SecondsSinceUnixEpoch, end: SecondsSinceUnixEpoch
    ) -> GenerateDocumentsOutput:
        if self.jira_client is None:
            raise ConnectorMissingCredentialError("Jira")

        start_date_str = datetime.fromtimestamp(start, tz=timezone.utc).strftime(
            "%Y-%m-%d %H:%M"
        )
        end_date_str = datetime.fromtimestamp(end, tz=timezone.utc).strftime(
            "%Y-%m-%d %H:%M"
        )

        # Quote the project name to handle reserved words
        quoted_project = f'"{self.jira_project}"'
        jql = (
            f"project = {quoted_project} AND "
            f"updated >= '{start_date_str}' AND "
            f"updated <= '{end_date_str}'"
        )

        start_ind = 0
        while True:
            doc_batch, fetched_batch_size = fetch_jira_issues_batch(
                jql=jql,
                start_index=start_ind,
                jira_client=self.jira_client,
                batch_size=self.batch_size,
                comment_email_blacklist=self.comment_email_blacklist,
                labels_to_skip=self.labels_to_skip,
            )

            if doc_batch:
                yield doc_batch

            start_ind += fetched_batch_size
            if fetched_batch_size < self.batch_size:
                break


if __name__ == "__main__":
    import os

    connector = JiraConnector(
        os.environ["JIRA_PROJECT_URL"], comment_email_blacklist=[]
    )
    connector.load_credentials(
        {
            "jira_user_email": os.environ["JIRA_USER_EMAIL"],
            "jira_api_token": os.environ["JIRA_API_TOKEN"],
        }
    )
    document_batches = connector.load_from_state()
    print(next(document_batches))
