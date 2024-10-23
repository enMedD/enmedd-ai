from typing import List
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from enmedd.db.models import DocumentSet as DocumentSetDBModel
from enmedd.server.documents.models import ConnectorCredentialPairDescriptor
from enmedd.server.documents.models import ConnectorSnapshot
from enmedd.server.documents.models import CredentialSnapshot
from enmedd.server.models import MinimalTeamspaceSnapshot
from enmedd.server.models import MinimalWorkspaceSnapshot


class DocumentSetCreationRequest(BaseModel):
    name: str
    description: str
    cc_pair_ids: List[int]
    is_public: bool
    # For Private Document Sets, who should be able to access these
    users: Optional[List[UUID]] = None
    groups: Optional[List[int]] = None


class DocumentSetUpdateRequest(BaseModel):
    id: int
    description: str
    cc_pair_ids: List[int]
    is_public: bool
    # For Private Document Sets, who should be able to access these
    users: List[UUID]
    groups: List[int]


class CheckDocSetPublicRequest(BaseModel):
    """Note that this does not mean that the Document Set itself is to be viewable by everyone
    Rather, this refers to the CC-Pairs in the Document Set, and if every CC-Pair is public
    """

    document_set_ids: List[int]


class CheckDocSetPublicResponse(BaseModel):
    is_public: bool


class DocumentSet(BaseModel):
    id: int
    name: str
    description: str
    cc_pair_descriptors: List[ConnectorCredentialPairDescriptor]
    is_up_to_date: bool
    is_public: bool
    # For Private Document Sets, who should be able to access these
    users: List[UUID]
    groups: Optional[List[MinimalTeamspaceSnapshot]] = None

    @classmethod
    def from_model(cls, document_set_model: DocumentSetDBModel) -> "DocumentSet":
        return cls(
            id=document_set_model.id,
            name=document_set_model.name,
            description=document_set_model.description,
            cc_pair_descriptors=[
                ConnectorCredentialPairDescriptor(
                    id=cc_pair.id,
                    name=cc_pair.name,
                    connector=ConnectorSnapshot.from_connector_db_model(
                        cc_pair.connector
                    ),
                    credential=CredentialSnapshot.from_credential_db_model(
                        cc_pair.credential
                    ),
                    groups=[
                        MinimalTeamspaceSnapshot(
                            id=groups.id,
                            name=groups.name,
                            workspace=[
                                MinimalWorkspaceSnapshot(
                                    id=workspace.id,
                                    workspace_name=workspace.workspace_name,
                                )
                                for workspace in groups.workspace
                            ],
                        )
                        for groups in cc_pair.groups
                    ],
                )
                for cc_pair in document_set_model.connector_credential_pairs
            ],
            is_up_to_date=document_set_model.is_up_to_date,
            is_public=document_set_model.is_public,
            users=[user.id for user in document_set_model.users],
            groups=[
                MinimalTeamspaceSnapshot(
                    id=groups.id,
                    name=groups.name,
                    workspace=[
                        MinimalWorkspaceSnapshot(
                            id=workspace.id, workspace_name=workspace.workspace_name
                        )
                        for workspace in groups.workspace
                    ],
                )
                for groups in document_set_model.groups
            ],
        )
