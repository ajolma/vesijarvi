import React, { Component } from 'react';
import { Menu, Input, Accordion, Icon, List, Label, Form, TextArea, Button } from 'semantic-ui-react';
import {connect} from 'react-redux';
import {hideLayer, showLayer, hideLeaf, showLeaf,
        selectFeature,
        selectLake, unselectLake,
        selectBackground,
        getBathymetry, sendFeedback}
from '../actions/initAction';
import L from 'leaflet';
import {mapsPlaceHolder} from '../index.js';
import {popupHtml, closePopups} from './MyMap';
import './LeftPanel.css';


class LeftPanel extends Component {

    constructor(props) {
        super(props);
        this.state = {
            active: [3,4,5],
            activeIndex: -1,
            topic: '',
            name: '',
            email: '',
            feedback: ''
        };
    }

    handleClick = (e, titleProps) => {
        const {index} = titleProps;
        const {active, activeIndex} = this.state;
        let newIndex = activeIndex === index ? -1 : index;
        let newActive = [];
        if ([3,4,5].indexOf(newIndex) !== -1) {
            newIndex = activeIndex;
        }
        if ([3,4,5].indexOf(index) !== -1) {
            if (active.indexOf(index) !== -1) {
                for (let i = 0; i < active.length; i++) {
                    if (active[i] !== index) {
                        newActive.push(active[i]);
                    }
                }
            } else {
                for (let i = 0; i < active.length; i++) {
                    newActive.push(active[i]);
                }
                newActive.push(index);
            }
        } else {
            for (let i = 0; i < active.length; i++) {
                newActive.push(active[i]);
            }
        }
        console.log(newIndex, newActive);
        this.setState({
            active: newActive,
            activeIndex: newIndex
        });
     }

    handleClick2 = (e) => {
        let i = parseInt(e.target.id, 10);
        let layer = this.props.layers[i];
        if (layer) {
            if (this.props.layers[i].visible) {
                this.props.dispatch(hideLayer(i));
            } else {
                this.props.dispatch(showLayer(i));
            }
        }
    }

    selectBackground = (e) => {
        let i = parseInt(e.target.id, 10);
        if (!this.props.backgrounds[i].visible) {
            this.props.dispatch(selectBackground(i));
        }
    }

    onLayerClick = (e) => {
        console.log(e);
        if (e.target.id === '') {
            return;
        }
        let index = parseInt(e.target.id, 10);
        if (index < 0) {
            if (index < -100) {
                this.props.dispatch(showLeaf(-(100+index)));
            } else {
                this.props.dispatch(hideLeaf(-index));
            }
        } else if (this.props.layers[index].visible) {
            this.props.dispatch(hideLayer(index));
        } else {
            this.props.dispatch(showLayer(index));
        }
    }

    places = {}

    onChangeOfPlace = (e) => {
        if (this.places.hasOwnProperty(e.target.value)) {
            let index = this.places[e.target.value];
            let feature = this.props.features[index];
            let latlng = feature.latlng;
            L.popup()
                .setLatLng(latlng)
                .setContent(popupHtml(this.props.popup, feature))
                .openOn(mapsPlaceHolder[0]);
            this.props.dispatch(selectFeature(index));
            e.target.value = '';
        }
    }

    onClickOnLake = (e) => {
        let index = parseInt(e.target.id, 10);
        let lake = this.props.lakes.features.features[index];
        if (!lake) {
            console.log('click on lake', index, this.props.lakes.features.features);
        } else {
            if (lake.show_bathymetry) {
                this.props.dispatch(unselectLake(index));
                closePopups();
            } else {
                if (!lake.bathymetry) {
                    this.props.dispatch(getBathymetry(lake));
                }
                let latlng = [lake.geometry.coordinates[1], lake.geometry.coordinates[0]];
                L.popup()
                    .setLatLng(latlng)
                    .setContent(popupHtml(this.props.popup, lake))
                    .openOn(mapsPlaceHolder[0]);
                this.props.dispatch(selectLake(index));
            }
        }
    }

    feedbackChanged = (e, { name, value }) => this.setState({ [name]: value })

    handleFeedback = () => {
        const {topic, name, email, feedback} = this.state;
        if (feedback.length < 4) {
            alert("Kirjoita palautetta, ole hyvä!");
            return;
        }
        this.props.dispatch(sendFeedback({
            topic: topic,
            name: name,
            email: email,
            feedback: feedback
        }));
        this.setState({
            topic: '',
            name: '',
            email: '',
            feedback: ''
        });
    }

    render() {
        let leafs = {
            1: {
                layers: [],
                title: 'Valuma-aluetoimenpiteet',
                hidden: true
            },
            2: {
                layers: [],
                title: 'Vesistötoimenpiteet',
                hidden: true
            },
            3: {
                layers: [],
                title: 'Seurannat',
                hidden: true
            },
            4: {
                layers: [],
                title: 'Lisätasot',
                hidden: true
            }
        };
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (!layer.features || layer.features.totalFeatures === 0) {
                continue;
            }
            let leaf = layer.leaf;
            let legend = layer.legend;
            let h = layer.graphic_height;
            let w = layer.graphic_width;
            let x = '', kuvaus = '', xclass = '', ximg = '';
            if (leaf >= 1 && leaf <= 3) {
            } else if (leaf >= 4 && leaf <= 5) {
                leaf = 4;
                if (layer.visible && legend) {
                    let url = 'media/' + legend;
                    ximg = <img alt="" src={url} height={h} width={w} id={i}/>;
                }
                legend = null;
                x = <br/>;
            } else {
                continue;
            }
            if (layer.visible) {
                leafs[leaf].hidden = false;
            } else {
                if (legend) {
                    legend = layer.legend_hidden;
                }
                xclass = '-hidden';
            }
            if (!legend) {
                if (layer.visible) {
                    legend = 'red-circle.svg';
                } else {
                    legend = 'grey-circle.svg';
                }
                h = 21;
                w = 21;
            }
            if (leaf > 3) {
                let class_name = 'layer-description'+xclass;
                kuvaus = <div id={i} className={class_name}>{layer.kuvaus}{ximg}</div>;
            }
            let url = 'media/' + legend;
            let img = <img alt="" src={url} height={h} width={w} id={i}/>;
            let class_name = 'layer-name'+xclass;
            let name = <span id={i} className={class_name}>{layer.name}</span>;
            let div =
                <div key={i} onClick={this.onLayerClick} id={i} style={{cursor: 'pointer'}}>
                    {img} {name} {x} {kuvaus}
                </div>;
            leafs[leaf].layers.push(div);
        }
        for (let leaf = 1; leaf < 5; leaf++) {
            let imgUrl, name, id;
            if (leafs[leaf].hidden) {
                id = -100-leaf;
                imgUrl = 'media/yes.svg';
                name = <span id={id} className="">Näytä kaikki {leafs[leaf].title.toLowerCase()}</span>;
            } else {
                imgUrl = 'media/no.svg';
                id = -leaf;
                name = <span id={id} className="">Piilota kaikki {leafs[leaf].title.toLowerCase()}</span>;
            }
            let div =
                <div key={id} onClick={this.onLayerClick} id={id} style={{cursor: 'pointer'}}>
                    <img alt="" src={imgUrl} height={21} width={21} id={id}/> {name}
                </div>;
            leafs[leaf].layers.unshift(div);
        }

        let datalist = [];
        for (let i = 0; i < this.props.features.length; i++) {
            let name = this.props.features[i].properties.nimi;
            this.places[name] = i;
            datalist.push(<option value={name} key={i} />);
        }

        let bgmaps = [];
        for (let i = 0; i < this.props.backgrounds.length; i++) {
            let bg = this.props.backgrounds[i];
            let imgUrl;
            let name = bg.otsikko;
            let kuvaus = bg.kuvaus;
            if (bg.visible) {
                imgUrl = 'media/red-circle.svg';
                name = <span id={i} className="">{name}</span>;
                kuvaus = <div id={i} className="layer-description">{kuvaus}</div>;
            } else {
                imgUrl = 'media/grey-circle.svg';
                name = <span id={i} className="hidden-layer-name">{name}</span>;
                kuvaus = <div id={i} className="layer-description-hidden">{kuvaus}</div>;
            }
            bgmaps.push(
                <div key={i} onClick={this.selectBackground} id={i} style={{cursor: 'pointer'}}>
                    <img alt="" src={imgUrl} height="21" width="21"/> {name} <br/>
                    {kuvaus}
                </div>
            );
        }

        let bathymetries = [];
        if (this.props.lakes) {
            for (let i = 0; i < this.props.lakes.features.features.length; i++) {
                let lake = this.props.lakes.features.features[i];
                if (!lake.properties.syvyyskartta) {
                    continue;
                }
                let imgUrl;
                let name = lake.properties.nimi;
                let bathy = '';
                if (lake.show_bathymetry) {
                    imgUrl = 'media/red-circle.svg';
                    name = <span id={i} className="">{name}</span>;
                    bathy = 'media/' + lake.properties.syvyyskartta + '.png';
                    bathy = <img className="layer-description" alt="" src={bathy}/>;
                } else {
                    imgUrl = 'media/grey-circle.svg';
                    name = <span id={i} className="hidden-layer-name">{name}</span>;
                }
                bathymetries.push(
                    <div key={i} onClick={this.onClickOnLake} id={i} style={{cursor: 'pointer'}}>
                        <img id={i} alt="" src={imgUrl} height="21" width="21"/> {name} <br/>
                        {bathy}
                    </div>
                );
            }
        }

        let flags = [];
        if (this.props.flags) {
            for (let i = 0; i < this.props.flags.length; i++) {
                let flag = this.props.flags[i];
                flags.push(
                    <a key={i} href={flag.url} target="_blank" rel="noopener noreferrer">
                        <img src={flag.img_url} alt={flag.alt} width="250"/>
                    </a>
                );
            }
        }

        let kuvaukset = [];
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (layer.leaf < 5 && layer.kuvaus) {
                let parts = layer.kuvaus.split(";");
                let content = [];
                let j = 0;
                while (j < parts.length) {
                    if (j+1 < parts.length && parts[j+1].substr(0, 5) === 'http:') {
                        content.push(<p key={j} className="left-para">{parts[j]}
                                     <a target="info" href={parts[j+1]}>(Lähde)</a></p>);
                        j += 2;
                    } else {
                        content.push(<p key={j} className="left-para">{parts[j]}</p>);
                        j += 1;
                    }
                }
                kuvaukset.push({
                    key: i,
                    title: {
                        content: <Label content={layer.name} />,
                    },
                    content:{
                        content: content
                    },
                });
            };
        }

        let oikeudet = [];
        for (let aineisto in this.props.oikeudet) {
            let o = this.props.oikeudet[aineisto];
            let lisenssi = '';
            if (o.lisenssi) {
                lisenssi = <a target="_blank" rel="noopener noreferrer" href={o.lisenssi}>Lisenssi</a>;
            }
            let metatieto = '';
            if (o.metatieto) {
                metatieto = <a target="_blank" rel="noopener noreferrer" href={o.metatieto}>Metatieto</a>;
            }
            let latauspvm = '';
            if (o.latauspvm) {
                latauspvm = <span>Ladattu {o.latauspvm}</span>;
            }
            let lisatieto = '';
            if (o.lisatieto) {
                lisatieto = <span>{o.lisatieto}</span>;
            }
            oikeudet.push(
                <List.Item key={aineisto}>
                    <List.Icon/>
                    <List.Content>
                        <List.Header>{aineisto}</List.Header>
                        <List.Description>
                            <a target="_blank" rel="noopener noreferrer" href={o.omistaja_url}>&copy; {o.omistaja}</a>&nbsp;
                            {lisenssi} {metatieto} {latauspvm} {lisatieto}
                        </List.Description>
                    </List.Content>
                </List.Item>
            );
        }

        const {active, activeIndex} = this.state;
        let isActive = [];
        for (let i = 0; i < 10; i++) {
            isActive[i] = activeIndex === i || active.indexOf(i) !== -1;
        }
        let color = [];
        for (let i = 0; i < 10; i++) {
            color[i] = isActive[i] ? 'teal' : 'grey';
        }

        return (
            <div className="LeftPanel" align="left">
                <Menu.Item>
                    <Input list='places'
                           className='icon'
                           icon='search'
                           placeholder='Hae...'
                           onChange={this.onChangeOfPlace} />
                    <datalist id='places'>
                        {datalist}
                    </datalist>
                </Menu.Item>
                <Accordion exclusive={false}>
                    <Accordion.Title active={isActive[0]} index={0} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[0]}>Taustakartta</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[0]}>
                        <div className="left-para">
                            {bgmaps}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[1]} index={1} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[1]}>Järvien syvyyskartat</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[1]}>
                        <div className="left-para">
                            {bathymetries}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[2]} index={2} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[2]}>{leafs[4].title}</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[2]}>
                        <div className="left-para">
                            {leafs[4].layers}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[3]} index={3} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[3]}>{leafs[3].title}</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[3]}>
                        <div className="left-para">
                            {leafs[3].layers}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[4]} index={4} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[4]}>{leafs[1].title}</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[4]}>
                        <div className="left-para">
                            {leafs[1].layers}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[5]} index={5} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[5]}>{leafs[2].title}</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[5]}>
                        <div className="left-para">
                            {leafs[2].layers}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[6]} index={6} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[6]}>Toimenpiteiden kuvaukset</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[6]}>
                        <Accordion panels={kuvaukset} />
                    </Accordion.Content>

                    <Accordion.Title active={isActive[7]} index={7} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[7]}>Aineistojen oikeudet</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[7]}>
                        <List>
                            {oikeudet}
                        </List>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[8]} index={8} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[8]}>Rahoittajat</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[8]}>
                        <div className="flags">
                            {flags}
                        </div>
                    </Accordion.Content>

                    <Accordion.Title active={isActive[9]} index={9} onClick={this.handleClick}>
                        <Icon name='dropdown' />
                        <Label color={color[9]}>Anna palautetta</Label>
                    </Accordion.Title>
                    <Accordion.Content active={isActive[9]}>
                        <Form onSubmit={this.handleFeedback}>
                            <Input
                                placeholder='Aihe' name='topic'
                                value={this.state.topic}
                                onChange={this.feedbackChanged} />
                            <Input
                                placeholder='Nimi' name='name'
                                value={this.state.name}
                                onChange={this.feedbackChanged} />
                            <Input
                                placeholder='Sähköpostiosoite'
                                name='email'
                                value={this.state.email}
                                onChange={this.feedbackChanged} />
                            <TextArea
                                placeholder='Palaute'
                                value={this.state.palaute}
                                onChange={this.feedbackChanged}
                                name='feedback' />
                            <Button>Lähetä</Button>
                        </Form>
                    </Accordion.Content>
                </Accordion>
            </div>
        );
    }

}

const mapStateToProps = (state) => {
    return {
        popup: state.init.popup,
        layers: state.init.layers,
        features: state.init.features,
        lakes: state.init.lakes,
        backgrounds: state.init.backgrounds,
        flags: state.init.flags,
        oikeudet: state.init.oikeudet,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(LeftPanel);
