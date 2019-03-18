// @flow

const { createReporter } = require(`yurnalist`)
const { stripIndent } = require(`common-tags`)
const convertHrtime = require(`convert-hrtime`)
const tracer = require(`opentracing`).globalTracer()
const { getErrorFormatter } = require(`./errors`)
const React = require(`react`)
const { render } = require(`ink`)
const GatsbyReporter = require(`./ink`)

const VERBOSE = process.env.gatsby_log_level === `verbose`

const errorFormatter = getErrorFormatter()
const reporter = createReporter({ emoji: true, verbose: VERBOSE })
const base = Object.getPrototypeOf(reporter)

type ActivityArgs = {
  parentSpan: Object,
}
let succesHandler
let setActivityStatusHandler
let startActivityHandler
let endActivityHandler

render(
  <GatsbyReporter
    init={({ onSuccess, startActivity, setActivityStatus, endActivity }) => {
      succesHandler = onSuccess
      startActivityHandler = startActivity
      setActivityStatusHandler = setActivityStatus
      endActivityHandler = endActivity
    }}
  />
)

/* Reporter module.
 * @module reporter
 */

module.exports = Object.assign(reporter, {
  /**
   * Strip initial indentation template function.
   */
  stripIndent,
  /**
   * Toggle verbosity.
   * @param {boolean} [isVerbose=true]
   */
  setVerbose(isVerbose = true) {
    this.isVerbose = !!isVerbose
  },
  /**
   * Turn off colors in error output.
   * @param {boolean} [isNoColor=false]
   */
  setNoColor(isNoColor = false) {
    if (isNoColor) {
      errorFormatter.withoutColors()
    }
  },
  /**
   * Log arguments and exit process with status 1.
   * @param {*} [arguments]
   */
  panic(...args) {
    this.error(...args)
    process.exit(1)
  },

  panicOnBuild(...args) {
    this.error(...args)
    if (process.env.gatsby_executing_command === `build`) {
      process.exit(1)
    }
  },

  error(message, error) {
    if (arguments.length === 1 && typeof message !== `string`) {
      error = message
      message = error.message
    }
    base.error.call(this, message)
    if (error) console.log(errorFormatter.render(error))
  },
  /**
   * Set prefix on uptime.
   * @param {string} prefix - A string to prefix uptime with.
   */
  uptime(prefix: string) {
    this.verbose(`${prefix}: ${(process.uptime() * 1000).toFixed(3)}ms`)
  },
  success(str) {
    succesHandler(str)
  },
  /**
   * Time an activity.
   * @param {string} name - Name of activity.
   * @param {activityArgs} activityArgs - optional object with tracer parentSpan
   * @returns {string} The elapsed time of activity.
   */
  activityTimer(name, activityArgs: ActivityArgs = {}) {
    const spinner = reporter.activity()
    const start = process.hrtime()
    let status

    const elapsedTime = () => {
      var elapsed = process.hrtime(start)
      return `${convertHrtime(elapsed)[`seconds`].toFixed(3)} s`
    }

    const { parentSpan } = activityArgs
    const spanArgs = parentSpan ? { childOf: parentSpan } : {}
    const span = tracer.startSpan(name, spanArgs)

    return {
      start: () => {
        startActivityHandler(name, ``)
      },
      setStatus: s => {
        setActivityStatusHandler(name, s)
      },
      end: () => {
        span.finish()
        const str = status
          ? `${name} — ${elapsedTime()} — ${status}`
          : `${name} — ${elapsedTime()}`
        endActivityHandler(name, str)
      },
      span: span,
    }
  },
})
