import React from 'react';
import { Button, Modal, Header } from 'semantic-ui-react';
import { Embed } from 'semantic-ui-react';

const MyModal = (props) => {
    //console.log('video props', props);
    const [open, setOpen] = React.useState(false);

    return (<Modal
              onClose={() => setOpen(false)}
              onOpen={() => setOpen(true)}
              open={open}
              trigger={<Button>Näytä esittelyvideo</Button>}
           >
             <Modal.Header>Vesijärven karttapalvelu</Modal.Header>
             <Modal.Content image>
               <Modal.Description>
                 <Header>Otsikko</Header>
                 <p>
                   Meillä on oma kanava ja nuo videot olisi hyvä varmaan ladata sieltä, etenkin jos se sujuvoittaa käyttöä.
                 </p>
                 <p>Onkos tämä hyvä?</p>
               </Modal.Description>
             </Modal.Content>
             <Embed
               id={props.id}
               source='youtube'
             />
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
