let BaseModule

try {
  BaseModule = require(require('requireg').resolve('huestatus/src/Module'))
} catch (e) {
  throw new Error('A HueStatus installation is required -- npm install -g huestatus')
}

const Sentry = require('sentry-api').Client

class HueTry extends BaseModule {
  /**
   * Generate instance name based on project and organisation
   * @return {String} [description]
   */
  generateInstanceName () {
    return `Sentry: ${this.config.organisation}/${this.config.project}`
  }

  /**
   * Start method, called on huestatus start. Loops through api polling
   */
  async start () {
    this._setUpConfig()
    setInterval(this._pollSentry.bind(this), this.config.pollInterval || 2000)
  }

  /**
   * Check for config variables and create Sentry API Client
   * @throws error when required config value is not set
   */
  _setUpConfig () {
    ['sentryApiKey', 'organisation', 'project'].map(configItem => {
      if (!this.config[configItem]) {
        throw new Error(`Sentry ${configItem} config value not set`)
      }
    })

    this.sentry = new Sentry({ token: this.config.sentryApiKey })
  }

  /**
   * Make a request to the sentry API, check for unresolved issues, then filter out already assigned issues
   * @return {Promise}
   */
  async _pollSentry () {
    const issues = await this.sentry.get(`projects/${this.config.organisation}/${this.config.project}/issues/`)

    const unassignedIssues = issues.filter(issue => !issue.assignedTo)

    if (unassignedIssues.length) {
      return this._alert(unassignedIssues.length)
    }

    return this._ok()
  }

  /**
   * Set the status to ok
   * @return {Promise}
   */
  async _ok () {
    await this.change('ok', 'No unassigned unresolved issues')
  }

  /**
   * Set the status to alert and log the number of issues
   * @param  {Number}  issuesCount Number of issues
   * @return {Promise}
   */
  async _alert (issuesCount) {
    await this.change('alert', `${issuesCount} unassigned unresolved issues`)
  }
}

module.exports = HueTry
