"""
This file takes the happy path to adding a curator to a user group and then tests
the permissions of the curator manipulating connectors.
"""
import pytest
from requests.exceptions import HTTPError

from enmedd.server.documents.models import DocumentSource
from tests.integration.common_utils.managers.connector import ConnectorManager
from tests.integration.common_utils.managers.teamspace import TeamspaceManager
from tests.integration.common_utils.managers.user import DATestUser
from tests.integration.common_utils.managers.user import UserManager


def test_connector_permissions(reset: None) -> None:
    # Creating an admin user (first user created is automatically an admin)
    admin_user: DATestUser = UserManager.create(name="admin_user")

    # Creating a curator
    curator: DATestUser = UserManager.create(name="curator")

    # Creating a user group
    teamspace_1 = TeamspaceManager.create(
        name="teamspace_1",
        user_ids=[curator.id],
        cc_pair_ids=[],
        user_performing_action=admin_user,
    )
    TeamspaceManager.wait_for_sync(
        teamspaces_to_check=[teamspace_1], user_performing_action=admin_user
    )
    # setting the user as a curator for the user group
    TeamspaceManager.set_curator_status(
        test_teamspace=teamspace_1,
        user_to_set_as_curator=curator,
        user_performing_action=admin_user,
    )

    # Creating another user group that the user is not a curator of
    teamspace_2 = TeamspaceManager.create(
        name="teamspace_2",
        user_ids=[curator.id],
        cc_pair_ids=[],
        user_performing_action=admin_user,
    )
    TeamspaceManager.wait_for_sync(
        teamspaces_to_check=[teamspace_1], user_performing_action=admin_user
    )

    # END OF HAPPY PATH

    """Tests for things Curators should not be able to do"""

    # Curators should not be able to create a public connector
    with pytest.raises(HTTPError):
        ConnectorManager.create(
            name="invalid_connector_1",
            source=DocumentSource.CONFLUENCE,
            groups=[teamspace_1.id],
            is_public=True,
            user_performing_action=curator,
        )

    # Curators should not be able to create a cc pair for a
    # user group they are not a curator of
    with pytest.raises(HTTPError):
        ConnectorManager.create(
            name="invalid_connector_2",
            source=DocumentSource.CONFLUENCE,
            groups=[teamspace_1.id, teamspace_2.id],
            is_public=False,
            user_performing_action=curator,
        )

    """Tests for things Curators should be able to do"""

    # Curators should be able to create a private
    # connector for a user group they are a curator of
    valid_connector = ConnectorManager.create(
        name="valid_connector",
        source=DocumentSource.CONFLUENCE,
        groups=[teamspace_1.id],
        is_public=False,
        user_performing_action=curator,
    )
    assert valid_connector.id is not None

    # Verify the created connector
    created_connector = ConnectorManager.get(
        valid_connector.id, user_performing_action=curator
    )
    assert created_connector.name == valid_connector.name
    assert created_connector.source == valid_connector.source

    # Verify that the connector can be found in the list of all connectors
    all_connectors = ConnectorManager.get_all(user_performing_action=curator)
    assert any(conn.id == valid_connector.id for conn in all_connectors)

    # Test editing the connector
    valid_connector.name = "updated_valid_connector"
    ConnectorManager.edit(valid_connector, user_performing_action=curator)

    # Verify the edit
    updated_connector = ConnectorManager.get(
        valid_connector.id, user_performing_action=curator
    )
    assert updated_connector.name == "updated_valid_connector"

    # Test deleting the connector
    ConnectorManager.delete(connector=valid_connector, user_performing_action=curator)

    # Verify the deletion
    all_connectors_after_delete = ConnectorManager.get_all(
        user_performing_action=curator
    )
    assert all(conn.id != valid_connector.id for conn in all_connectors_after_delete)

    # Test that curator cannot create a connector for a group they are not a curator of
    with pytest.raises(HTTPError):
        ConnectorManager.create(
            name="invalid_connector_3",
            source=DocumentSource.CONFLUENCE,
            groups=[teamspace_2.id],
            is_public=False,
            user_performing_action=curator,
        )

    # Test that curator cannot create a public connector
    with pytest.raises(HTTPError):
        ConnectorManager.create(
            name="invalid_connector_4",
            source=DocumentSource.CONFLUENCE,
            groups=[teamspace_1.id],
            is_public=True,
            user_performing_action=curator,
        )
