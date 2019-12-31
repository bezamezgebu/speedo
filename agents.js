const fileUtilities = require('./fileUtilities')

const express = require('express')
const bodyParser = require('body-parser')

const router = express.Router()

const agentsJsonFile = './data/agents.json'
const customersJsonFile = './data/customers.json'

router.use(express.static('data'))

router.use(bodyParser.json())

router.use(express.json())

router.get('/', (req, resp) => {
  console.log('Handling GET /agents request...')
  const agentList = fileUtilities.readJsonObjectsFromFile(agentsJsonFile)
  console.dir(agentList)
  resp.header('Content-Type', 'application/json')
  resp.send(JSON.stringify(agentList, null, 4))
})

function createAgent (requestBody) {
  console.dir(requestBody)
  var agent = {}
  agent._id = fileUtilities.generateId(agentsJsonFile)
  agent.name = requestBody.name
  if (requestBody.address) {
    agent.address = requestBody.address
  }
  if (requestBody.city) {
    agent.city = requestBody.city
  }
  if (requestBody.state) {
    agent.state = requestBody.state
  }
  if (requestBody.zipcode) {
    agent.zipcode = requestBody.zipcode
  }
  if (requestBody.tier) {
    agent.tier = requestBody.tier
  }
  agent.phone = {}
  if (requestBody.phone && requestBody.phone.primary) {
    agent.phone.primary = requestBody.phone.primary
  }
  if (requestBody.phone && requestBody.phone.mobile) {
    agent.phone.mobile = requestBody.phone.mobile
  }

  return agent
}

router.post('/', (req, resp) => {
  console.log('Handling POST /agents request...')

  // validate body, make sure that all required fields are present (return an error response - maybe "400 - name field is required")
  if (!req.body.name || req.body.name === '' ||
      !req.body.phone ||
      !req.body.phone.mobile || req.body.phone.mobile === '') {
    resp.status(400).json({ error: 'name field and mobile number is required.' })
    return
  }
  // generate an id (make sure it is unique and doesn't already exist)

  var agent = createAgent(req.body)
  console.log('created new agent:')
  console.dir(agent)

  const agentList = fileUtilities.readJsonObjectsFromFile(agentsJsonFile)

  console.log('before adding new agent...')
  console.dir(agentList)
  agentList.push(agent)
  console.log('after new agent is added')
  console.dir(agentList)
  fileUtilities.writeJsonObjectsToFile(agentList, agentsJsonFile)

  resp.header('Content-Type', 'application/json')
  resp.send(JSON.stringify(agent, null, 4))
})

router.get('/:id', (req, resp) => {
  console.log('Handling GET /:id request....')

  var agentDetail = null
  const agentId = req.params.id
  console.log('Updating agent: ' + agentId)

  const agentList = fileUtilities.readJsonObjectsFromFile(agentsJsonFile)
  agentList.forEach(function (agent) {
    if (parseInt(agent._id) === parseInt(agentId)) {
      console.log('found the agent with id: ' + agentId)
      agentDetail = agent
      console.dir(agentDetail)
    }
  })
  if (agentDetail != null) {
    resp.header('Content-Type', 'application/json')
    resp.send(JSON.stringify(agentDetail, null, 4))
  } else {
    resp.status(404).json({ error: 'No agent found with ID ' + agentId })
  }
})

router.put('/:id', (req, resp) => {
  console.log('Handling PUT /:id request....')

  if (!req.params.id || req.params.id === '') {
    resp.status(400).json({ error: 'ID field is required.' })
    return
  }

  const agentList = fileUtilities.readJsonObjectsFromFile(agentsJsonFile)
  var updatedAgentList = []
  const agentIdToUpdate = req.params.id
  console.log('Updating agent: ' + agentIdToUpdate)
  var foundMatchingId = false
  // if there is no id param, return 400 ('id is required')
  // for each agent in agentList:
  //    If the agentID is the one we are looking for, update any fields that were included in the request body
  //    Add the agent to updatedAgentList (whether or not we updated it)

  // if we got through the entire Foreach loop and didn't find a matching agent ID, return 404 "agent with that id was not found"
  // otherwise, write the updateAgentList to the json file (overwrite previous contents)
  // console.log('in foreach loop, current agent id is ' + agent._id)

  agentList.forEach(function (agent) {
    console.log('agentId from file : ' + parseInt(agent._id))
    console.log('agentId from request: ' + parseInt(agentIdToUpdate))

    if (parseInt(agent._id) === parseInt(agentIdToUpdate)) {
      foundMatchingId = true
      console.log('i have found the id to update ' + agentIdToUpdate)
      if (req.body.name) {
        agent.name = req.body.name
      }
      if (req.body.address) {
        agent.address = req.body.address
      }
      if (req.body.city) {
        agent.city = req.body.city
      }
      if (req.body.state) {
        agent.state = req.body.state
      }
      if (req.body.zipcode) {
        agent.zipcode = req.body.zipcode
      }
      if (req.body.tier) {
        agent.tier = req.body.tier
      }
      if (req.body.phone && req.body.phone.primary) {
        agent.phone.primary = req.body.phone.primary
      }
      if (req.body.phone && req.body.phone.mobile) {
        agent.phone.mobile = req.body.phone.mobile
      }
    }
    updatedAgentList.push(agent)
  })

  if (!foundMatchingId) {
    resp.status(404).json({ error: 'No agent found with ID ' + agentIdToUpdate })
    return
  }

  fileUtilities.writeJsonObjectsToFile(updatedAgentList, agentsJsonFile)
  resp.status(200).json({ message: 'Agent ' + agentIdToUpdate + ' updated.' })
})

router.get('/:id/customers', (req, resp) => {
  console.log('Handling GET /agents/:id/customers request....')

  const customerList = fileUtilities.readJsonObjectsFromFile(customersJsonFile)
  var matchingCustomers = []
  const agentId = req.params.id

  // look at every customer in customerList
  // if a customer has the same agent ID as the passed in ID, then add it
  // to the list we will return

  customerList.forEach(function (customer) {
    if (parseInt(customer.agent_id) === parseInt(agentId)) {
      var addressFields = customer.address.split(',')
      console.dir(addressFields)
      var city, state
      if (addressFields.length >= 3) {
        city = addressFields[1].trim()
        state = addressFields[2].trim()
      }
      var customerDetails =
        {
          firstName: customer.name.first,
          lastName: customer.name.last,
          city: city,
          state: state
        }
      matchingCustomers.push(customerDetails)
    }
  })
  console.dir(matchingCustomers)
  if (matchingCustomers.length === 0) {
    resp.status(404).json({ error: 'No customers found with agent ID ' + agentId })
    return
  }

  resp.header('Content-Type', 'application/json')
  resp.send(JSON.stringify(matchingCustomers, null, 4))
})

module.exports = router
