import React from 'react';
import { Popup, Button } from 'semantic-ui-react';

class PopupExampleControlled extends React.Component {
    state = { isOpen: false }

    handleOpen = () => {
        this.setState({ isOpen: true });
    }

    handleClose = () => {
        this.setState({ isOpen: false });
    }

    render() {
        return (
            <Popup
              trigger={<Button content='Open controlled popup' />}
              content={`Hello`}
              on='click'
              open={this.state.isOpen}
              onClose={this.handleClose}
              onOpen={this.handleOpen}
              position='top right'
            />
        );
    }
}

export default PopupExampleControlled;
