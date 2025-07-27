# Bekender Code Action from BEKENDER.RU 🍺

This tool allows you to run block chains inside your schemas on the platform BEKENDER.RU through the "code action" trigger. bekender.ru
this is a low-code platform for technical projects.
Quickly create projects without writing code. Integration with your existing projects, integration for direct interaction with your code and schemas.
This trigger running is free! So feel free to use and test it on the BEKENDER.RU

### detail documentation

[DOC.BEKENDER.RU 📊](https://doc.bekender.ru/features/remote-config-peremennye)


### installation

> yarn add bekender-code-action

or 

> npm i bekender-code-action

### usage 

#### for javascript typescript app projects:

```ts

import {bekenderCodeAction} from "bekender-code-action"

//run no-code trigger from code
const codeActionResponse = await bekenderCodeAction.startTriggerAction({
  api_key: 'string',
  scheme_id: 'string',
  code_action_slug: 'string',
  payload: {},
})
console.log({codeActionResponse})

```

#### for html js projects:

```html

<!--bekender remote config connect to web site - add it before closing </body> tag on your site -->
<script src="https://s3.timeweb.cloud/c14a1252-bekender-files/cdn_libraries/bekender-code-action.cjs.js"></script>

<!--any other your script-->
<script>
  //run no-code trigger from code
  const codeActionResponse = await bekenderCodeAction.startTriggerAction({
    api_key: 'string',
    scheme_id: 'string',
    code_action_slug: 'string',
    payload: {},
  })
  console.log({codeActionResponse})
</script>
```

#### for other platforms projects usage:

```curl

curl --location 'https://api.bekender.ru/runner/run_code_action_trigger/<api_key>/<scheme_id>/<code_action_triger_slug>' \
--header 'Content-Type: application/json' \
--header 'Authorization: ••••••' \
--data '{
  
}'

```

# FAQ

### Where is the API key ("api_key"): 
- get your own api key from your BEKENDER account settings here: https://cloud.bekender.ru/settings

### Where is the "scheme_id":
- get your "scheme id" after create some no-code scheme on bekender.ru
 
### what these parameters mean: "code_action_slug": 
- it is a no code block scheme name, managed by you. 

# Contacts

No-Code & Business & Analytics Cloud Platform [BEKENDER.RU](https://bekender.ru)

Platform Console [CLOUD.BEKENDER.RU](https://cloud.bekender.ru)

Platform documentation [DOC.BEKENDER.RU](https://doc.bekender.ru)
