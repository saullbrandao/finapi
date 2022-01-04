const { request } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

function verifyIfAccountExists(req, res, next) {
  const { cpf } = req.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' })
  }

  request.customer = customer

  return next()
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if (customerAlreadyExists) {
    return res.status(400).json({ error: 'Customer already exists' })
  }

  const customer = {
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  }

  customers.push(customer)

  return res.status(201).send()
})

app.get('/statement', verifyIfAccountExists, (req, res) => {
  const { customer } = req

  return res.json(customer.statement)
})

app.post('/deposit', verifyIfAccountExists, (req, res) => {
  const { customer } = req

  const { description, amount } = req.body

  const deposit = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  }

  customer.statement.push(deposit)

  return res.status(201).send()
})

app.listen(3333)
