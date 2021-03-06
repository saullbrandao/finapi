const { request } = require('express')
const { response } = require('express')
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

function getAccountBalance(statement) {
  return statement.reduce((acc, transaction) => {
    if (transaction.type === 'credit') {
      return acc + transaction.amount
    }

    return acc - transaction.amount
  }, 0)
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

app.post('/withdraw', verifyIfAccountExists, (req, res) => {
  const { customer } = req

  const { amount } = req.body
  const balance = getAccountBalance(customer.statement)

  if (amount > balance) {
    return res.status(400).json({ error: 'Insufficient funds' })
  }

  const withdraw = {
    amount,
    created_at: new Date(),
    type: 'debit',
  }

  customer.statement.push(withdraw)

  return res.status(201).send()
})

app.get('/statement/date', verifyIfAccountExists, (req, res) => {
  const { customer } = req
  const { date } = req.query

  const dateFormat = new Date(date + ' 00:00')

  const statement = customer.statement.filter(
    transaction =>
      transaction.created_at.toDateString() ===
      new Date(dateFormat).toDateString(),
  )

  return res.json(statement)
})

app.put('/account', verifyIfAccountExists, (req, res) => {
  const { name } = req.body
  const { customer } = req

  customer.name = name

  return res.status(201).send()
})

app.get('/account', verifyIfAccountExists, (req, res) => {
  const { customer } = request

  return res.json(customer)
})

app.delete('/account', verifyIfAccountExists, (req, res) => {
  const { customer } = req

  customers.splice(customer, 1)

  return res.status(200).json(customers)
})

app.get('/balance', verifyIfAccountExists, (req, res) => {
  const { customer } = req

  const balance = getAccountBalance(customer.statement)

  return res.json({ balance })
})

app.listen(3333)
