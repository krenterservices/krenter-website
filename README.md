# KRenter Website

KRenter website


### Domain config for firebase & Squarespace:

the domain details need to be inserted in the squarespace like this. Or else it will not work. look into the names `A --> @`,   `CNAME --> only subdomain and .krenter.org removed  ` and for the `TXT --> @`.

Firebase app domain config will ask to add the entire name for each of them but it did not work. as domain config takes time like 24 hours you will wait a lot to get t working.

When adding the domain firebase will give you full domain name, just copy the subdomain part and put it in the squarespace domain config. For example, if firebase gives you `_acme-challenge_tko4xnq2rja5zoh7.krenter.org` then you will only put `_acme-challenge_tko4xnq2rja5zoh7` in the squarespace domain config.

| Type  | Name                              | Priority | TTL     | Data                                                                          |
|-------|-----------------------------------|----------|---------|-------------------------------------------------------------------------------|
| A     | @                                 | N/A      | 30 mins | 35.219.200.198                                                                 |
| CNAME | _acme-challenge_tko4xnq2rja5zoh7 | N/A      | 30 mins | 3b6444db-0e2c-437a-982d-deaddb0ed1e9.19.authorize.certificatemanager.goog      |
| TXT   | @                                 | N/A      | 30 mins | fah-claim=023-02-ec2b4f34-b018-4cd3-b4af-1c485ab0fa11                         |



## Additional Resources
