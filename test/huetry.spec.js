/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const HueTry = require('../')

let mockConfig
let huetry
let sentryStub
let changeStub

describe('HueTry Class', function () {
  beforeEach(() => {
    mockConfig = {
      name: 'huetry',
      sentryApiKey: '3abxxxxxxxxxxxxxxxxx0f5',
      project: 'myProject',
      organisation: 'myOrg',
      pollInterval: 5000,
      light: 'Hue color lamp 2'
    }

    huetry = new HueTry(mockConfig, {})
  })

  it('It should set up the sentry api client', async () => {
    expect(huetry.config).to.be.an('object')
    expect(huetry.sentry).to.be.undefined

    huetry._setUpConfig()

    expect(huetry.sentry).to.be.an('object')
  })

  it('It should set status to ok if there are no issues', async () => {
    const huetry = new HueTry(mockConfig, {})
    huetry._setUpConfig()
    sentryStub = sinon.stub(huetry.sentry, 'get').resolves([])
    changeStub = sinon.stub(huetry, 'change').resolves(true)

    await huetry._pollSentry()

    expect(sentryStub).to.be.calledWith('projects/myOrg/myProject/issues/')
    expect(changeStub).to.be.calledWith('ok', 'No unassigned unresolved issues')

    sentryStub.restore()
    changeStub.restore()
  })

  it('It should set status to ok if there are no unassigned issues', async () => {
    const huetry = new HueTry(mockConfig, {})
    huetry._setUpConfig()
    sentryStub = sinon.stub(huetry.sentry, 'get').resolves([{ assignedTo: 'Ian' }])
    changeStub = sinon.stub(huetry, 'change').resolves(true)

    await huetry._pollSentry()

    expect(sentryStub).to.be.calledWith('projects/myOrg/myProject/issues/')
    expect(changeStub).to.be.calledWith('ok', 'No unassigned unresolved issues')

    sentryStub.restore()
    changeStub.restore()
  })

  it('It should set status to alert if there are unassigned issues', async () => {
    const huetry = new HueTry(mockConfig, {})
    huetry._setUpConfig()
    sentryStub = sinon.stub(huetry.sentry, 'get').resolves([{ assignedTo: null }, { assignedTo: null }])
    changeStub = sinon.stub(huetry, 'change').resolves(true)

    await huetry._pollSentry()

    expect(sentryStub).to.be.calledWith('projects/myOrg/myProject/issues/')
    expect(changeStub).to.be.calledWith('alert', '2 unassigned unresolved issues')

    sentryStub.restore()
    changeStub.restore()
  })

  it('Should throw when config variable is missing', () => {
    mockConfig.organisation = undefined
    const huetry = new HueTry(mockConfig, {})
    expect(() => { huetry._setUpConfig() }).to.throw('Sentry organisation config value not set')
  })

  it('Should generate instance name based on org and project', () => {
    const huetry = new HueTry(mockConfig, {})
    expect(huetry.instanceName).to.equal('Sentry: myOrg/myProject')
  })

  it('Should poll every x seconds', async () => {
    this.clock = sinon.useFakeTimers()
    const huetry = new HueTry(mockConfig, {})
    huetry._setUpConfig()

    sinon.stub(huetry, '_pollSentry')

    await huetry.start()

    this.clock.tick(3000)

    expect(huetry._pollSentry).to.not.be.called

    this.clock.tick(3000)

    expect(huetry._pollSentry).to.be.calledOnce

    this.clock.tick(3000)

    expect(huetry._pollSentry).to.be.calledOnce

    this.clock.tick(3000)

    expect(huetry._pollSentry).to.be.calledTwice

    this.clock.restore()
  })

  it('Poll every 2 seconds by default', async () => {
    this.clock = sinon.useFakeTimers()
    mockConfig.pollInterval = undefined
    const huetry = new HueTry(mockConfig, {})
    huetry._setUpConfig()

    sinon.stub(huetry, '_pollSentry')

    await huetry.start()

    this.clock.tick(1200)

    expect(huetry._pollSentry).to.not.be.called

    this.clock.tick(1200)

    expect(huetry._pollSentry).to.be.calledOnce

    this.clock.tick(1200)

    expect(huetry._pollSentry).to.be.calledOnce

    this.clock.tick(1200)

    expect(huetry._pollSentry).to.be.calledTwice

    this.clock.restore()
  })

  it('Should throw an error when HueStatus is not found', () => {
    delete require.cache[require.resolve('requireg')]
    delete require.cache[require.resolve('../')]
    const requiregStub = sinon.stub(require('requireg'), 'resolve').throws('Not found')

    expect(() => { require('../') }).to.throw('A HueStatus installation is required -- npm install -g huestatus')

    requiregStub.restore()
  })
})
