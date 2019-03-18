const React = require(`react`)
const { Static, Box, Color } = require(`ink`)

const Success = ({ children }) => (
  <Box>
    <Color green>success</Color> {children}
  </Box>
)

class Activity extends React.Component {
  state = {
    status: ``,
    elapsedTime: 0,
  }

  render() {
    return (
      <>
        {name} - {this.state.elapsedTime} - {status}
      </>
    )
  }
}

class GatsbyReporter extends React.Component {
  state = {
    messages: [],
    activities: {},
  }

  startActivity = (name, str) => {}

  setActivityStatus = (name, str) => {}

  endActivity = (name, str) => {}

  onSuccess = str => {
    this.setState(state => {
      return {
        messages: [...state.messages, str],
      }
    })
  }

  componentDidMount() {
    if (this.props.init) {
      this.props.init({
        onSuccess: this.onSuccess,
        startActivity: this.startActivity,
        setActivityStatus: this.setActivityStatus,
        endActivity: this.endActivity,
      })
    }
  }

  render() {
    return (
      <Box flexDirection="column">
        <Static>Building gatsby</Static>
        <Box flexDirection="column" marginTop={1}>
          {this.state.messages.map(msg => (
            <Success key={msg}>{msg}</Success>
          ))}
        </Box>
      </Box>
    )
  }
}

module.exports = GatsbyReporter
