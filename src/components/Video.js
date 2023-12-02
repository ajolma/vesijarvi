import React from 'react';
import { Embed, Button, Modal, Container, Header } from 'semantic-ui-react';

const MyModal = (props) => {
    const [open, setOpen] = React.useState(false);
    let embed = '';
    if (props.video !== '') {
        embed = <Embed
                  id={props.video}
                  source='youtube'
                />;
    }
    return (<Modal
              onClose={() => setOpen(false)}
              onOpen={() => setOpen(true)}
              open={open}
              trigger={<Button>{props.label}</Button>}
           >
             <Modal.Header>{props.header}</Modal.Header>
             <Modal.Content image>
               <Modal.Description>
                 <Container text>
                   <Header>{props.otsikko}</Header>
                   <p>
                     {props.kuvaus}
                 </p>
                 </Container>
               </Modal.Description>
             </Modal.Content>
              {embed}
             <Modal.Actions>
               <Button
                 content="Sulje video"
                 labelPosition='right'
                 icon='checkmark'
                 onClick={() => setOpen(false)}
                 positive
               />
             </Modal.Actions>
            </Modal>);
};

export default MyModal;
