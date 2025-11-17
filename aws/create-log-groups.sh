#!/bin/bash
aws logs create-log-group --log-group-name /ecs/perspec-api --region ap-southeast-2 2>&1 | grep -v "ResourceAlreadyExistsException" || true
aws logs create-log-group --log-group-name /ecs/perspec-client --region ap-southeast-2 2>&1 | grep -v "ResourceAlreadyExistsException" || true

