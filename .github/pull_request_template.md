## Description
**Ticket ID:** [ Include the ticket ID from AITable where this PR is related to ]

[
    Provide a detailed description of the changes in this PR, specifically answering the following questions: 
    - what is the purpose of this PR?
    - what changes have been made?
]

## Dependencies

[Include here new dependencies introduced if there is one]

## Checklist:
- [ ] Are there any merge conflicts? If there is, update your current branch with the latest version of the environment branch (e.g. `development-environment`) you are requesting to merge to.
- [ ] Does the PR contain only a single feature / bug fix? If not, consider breaking it down.
- [ ] Does the code follows the [Organization Coding Standards](https://aitable.ai/workbench/dstBUjfN2km2uTL7Ui/viwLfnJ30iHas?recordId=recEmvoxRXjGW&fieldId=fldP2q3QTsV7i)?
- [ ] Do you think that the code complies with the [Code Review Checklist](https://aitable.ai/workbench/dstBUjfN2km2uTL7Ui/viwLfnJ30iHas?recordId=recvHJo8sGPpz&fieldId=fldP2q3QTsV7i#heading-2) criterias?
- [ ] Does the code include unit tests and is added to the CI pipeline
- [ ] Is the platform been tested in a full docker-compose build and run?
- [ ] Is there a new dependencies introduces? If there is, are they added to the requirement text files (Python) and is included in the **Dependencies** section of this PR.
- [ ] Is there new environment variables? If there is, add this to all deployment methods in the Docker Compose yaml files (you can see those under `/deployment/docker-compose` directory)
- [ ] Is there new APIs? Make sure that the new API is documnted properly using Swagger. Learn more on how to use the Swagger documentation at the Section 4.2 of [Organization Coding Standards](https://aitable.ai/workbench/dstBUjfN2km2uTL7Ui/viwLfnJ30iHas?recordId=recEmvoxRXjGW&fieldId=fldP2q3QTsV7i#heading-10)
- [ ] Is there new APIs that don't require authentication? If there is, add it into the `PUBLIC_ENDPOINT_SPECS` in the `/server/auth_check.py` file with the following format `(endpoint_name, {http_method})`
- [ ] Author has done a final read throgh of the PR right before merge

