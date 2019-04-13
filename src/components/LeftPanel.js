import React, { Component } from 'react';
import { Menu, Input, Accordion, Icon, List, Label, Form, TextArea, Button } from 'semantic-ui-react';
import {connect} from 'react-redux';
import {hideLayer, showLayer, hideLeaf, showLeaf,
        selectFeature,
        selectLake, unselectLake,
        selectBackground,
        getBathymetry, sendFeedback, setZoom}
from '../actions/initAction';
import L from 'leaflet';
import {mapsPlaceHolder} from '../index.js';
import {popupHtml, closePopups} from './MyMap';
import './LeftPanel.css';

// ehkä https://icons8.com/license

import {
    BACKGROUND,
    CATCHMENT_ACTIONS,
    LAKE_ACTIONS,
    MONITORING,
    LAKE,
    CATCHMENT,
    LAKE_BATHYMETRY,
    ACTIONS,
    RIGHTS,
    FUNDERS,
    FEEDBACK
} from '../reducers/initReducer';

class LeftPanel extends Component {

    constructor(props) {
        super(props);
        this.state = {
            active: [CATCHMENT_ACTIONS, LAKE_ACTIONS],
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
        if ([CATCHMENT_ACTIONS, LAKE_ACTIONS].indexOf(newIndex) !== -1) {
            newIndex = activeIndex;
        }
        if ([CATCHMENT_ACTIONS, LAKE_ACTIONS].indexOf(index) !== -1) {
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
        this.setState({
            active: newActive,
            activeIndex: newIndex
        });
    }

    selectBackground = (e) => {
        let i = parseInt(e.target.id, 10);
        if (!this.props.backgrounds[i].visible) {
            this.props.dispatch(selectBackground(i));
        }
    }

    onLayerClick = (e) => {
        if (e.target.id === '') {
            return;
        }
        let index = parseInt(e.target.id, 10);
        if (index < 0) {
            if (index < -100) {
                let leaf = -(100+index);
                if (leaf === LAKE_BATHYMETRY && this.props.lakes) {
                    for (let i = 0; i < this.props.lakes.features.features.length; i++) {
                        let lake = this.props.lakes.features.features[i];
                        if (lake && lake.properties.syvyyskartta && !lake.bathymetry) {
                            this.props.dispatch(getBathymetry(lake));
                        }
                    }
                }
                this.props.dispatch(showLeaf(leaf));
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
        console.log(e);
        if (this.places.hasOwnProperty(e.target.value)) {
            console.log(e.target.value);
            let index = this.places[e.target.value];
            let feature = this.props.features[index];
            let latlng = feature.latlng;
            console.log(index,feature,latlng);
            L.popup()
                .setLatLng(latlng)
                .setContent(popupHtml(this.props.popup, feature))
                .openOn(mapsPlaceHolder[0]);
            this.props.dispatch(selectFeature(index));
            this.props.dispatch(setZoom(13));
            e.target.value = '';
        }
    }

    onClickOnLake = (e) => {
        let index = parseInt(e.target.id, 10);
        let lake = this.props.lakes.features.features[index];
        if (lake) {
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

    layer_legend = (visible, id, legend, h, w) => {
        if (!legend) {
            if (visible) {
                legend = 'red-circle.svg';
            } else {
                legend = 'grey-circle.svg';
            }
            h = 21;
            w = 21;
        }
        let url = 'media/' + legend;
        return <img id={id} alt="" src={url} height={h} width={w}/>;
    }

    layer_name = (visible, id, name) => {
        let class_name = 'layer-name';
        if (!visible) {
            class_name += '-hidden';
        }
        return <span id={id} className={class_name}>{name}</span>;
    }

    layer_descr = (visible, id, descr, image, h, w) => {
        let class_name = 'layer-description';
        let img = '';
        if (visible) {
            if (image) {
                let url = 'media/' + image;
                if (h) {
                    img = <img alt="" src={url} height={h} width={w}/>;
                } else {
                    img = <img alt="" src={url}/>;
                }
            }
        } else {
            class_name += '-hidden';
        }
        return <div id={id} className={class_name}>{descr}{img}</div>;
    }

    render() {

        let leafs = this.props.leafs;
        if (!leafs || this.props.layers.length === 0) {
            return <br/>;
        }
        for (let leaf in leafs) {
            leafs[leaf].layers = [];
            leafs[leaf].hidden = true;
        }

        let key = 0;
        for (let i = 0; i < this.props.backgrounds.length; i++) {
            let bg = this.props.backgrounds[i];
            let legend = this.layer_legend(bg.visible, i);
            let name = this.layer_name(bg.visible, i, bg.otsikko);
            let descr = this.layer_descr(bg.visible, i, bg.kuvaus);
            leafs[BACKGROUND].layers.push(
                <div key={key} onClick={this.selectBackground} id={i} style={{cursor: 'pointer'}}>
                    {legend} {name} <br/> {descr}
                </div>
            );
            key++;
        }

        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            let leaf = layer.leaf;
            let legend = layer.legend;
            let h = layer.graphic_height;
            let w = layer.graphic_width;
            let descr = '';
            switch (leaf) {
            case CATCHMENT_ACTIONS:
            case LAKE_ACTIONS:
            case MONITORING:
                break;
            case LAKE:
            case CATCHMENT:
                if (!layer.legend_hidden) {
                    descr = this.layer_descr(layer.visible, i, layer.kuvaus, legend, h, w);
                    legend = null;
                } else {
                    descr = this.layer_descr(layer.visible, i, layer.kuvaus);
                }
                break;
            default:
                continue;
            }
            if (layer.visible) {
                leafs[leaf].hidden = false;
            } else if (legend) {
                legend = layer.legend_hidden;
            }
            let img = this.layer_legend(layer.visible, i, legend, h, w);
            let name = this.layer_name(layer.visible, i, layer.name);
            let div =
                <div key={key} onClick={this.onLayerClick} id={i} style={{cursor: 'pointer'}}>
                    {img} {name} <br/> {descr}
                </div>;
            leafs[leaf].layers.push(div);
            key++;
        }
        if (this.props.lakes) {
            for (let i = 0; i < this.props.lakes.features.features.length; i++) {
                let lake = this.props.lakes.features.features[i];
                if (!lake.properties.syvyyskartta) {
                    continue;
                }
                let visible = lake.show_bathymetry;
                if (visible) {
                    leafs[LAKE_BATHYMETRY].hidden = false;
                }
                let img = this.layer_legend(visible, i);
                let name = this.layer_name(visible, i, lake.properties.nimi);
                let descr = this.layer_descr(visible, i, '', lake.properties.syvyyskartta + '.png');
                leafs[LAKE_BATHYMETRY].layers.push(
                    <div key={key} onClick={this.onClickOnLake} id={i} style={{cursor: 'pointer'}}>
                        {img} {name} <br/> {descr}
                    </div>
                );
                key++;
            }
        }
        for (let leaf in leafs) {
            if (!leafs[leaf].layers || parseInt(leaf, 10) === BACKGROUND) {
                continue;
            }
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
                <div key={key} onClick={this.onLayerClick} id={id} style={{cursor: 'pointer'}}>
                    <img alt="" src={imgUrl} height={21} width={21} id={id}/> {name}
                </div>;
            leafs[leaf].layers.unshift(div);
            key++;
        }

        let datalist = [];
        for (let i = 0; i < this.props.features.length; i++) {
            let name = this.props.features[i].properties.nimi;
            this.places[name] = i;
            datalist.push(<option value={name} key={key} />);
            key++;
        }

        let flags = [];
        if (this.props.flags) {
            for (let i = 0; i < this.props.flags.length; i++) {
                let flag = this.props.flags[i];
                flags.push(
                    <a key={key} href={flag.url} target="_blank" rel="noopener noreferrer">
                        <img src={flag.img_url} alt={flag.alt} width="250"/>
                    </a>
                );
                key++;
            }
        }

        let kuvaukset = [];
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if ((layer.leaf === 1 || layer.leaf === 2) && layer.kuvaus) {
                let parts = layer.kuvaus.split(";");
                let content = [];
                for (let j = 0; j < parts.length; j++) {
                    //console.log(parts[j]);
                    if (parts[j].substr(0, 4) === 'http') {
                        content.push(
                            <p key={key} className="left-para">
                                <a target="info" href={parts[j]}>(Lähde)</a>
                            </p>);
                    } else {
                        content.push(<p key={key} className="left-para">{parts[j]}</p>);
                    }
                    key++;
                }
                let title;
                if (layer.kuvausotsikko) {
                    title = layer.kuvausotsikko;
                } else {
                    title = layer.name;
                }
                kuvaukset.push({
                    key: i,
                    order: layer.kuvaustaso,
                    title: {
                        content: <Label content={title} />,
                    },
                    content:{
                        content: content
                    },
                });
            };
        }
        kuvaukset.sort(function(a, b) {return a.kuvaustaso - b.kuvaustaso;});

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
                            <a target="_blank" 
                               rel="noopener noreferrer" 
                               href={o.omistaja_url}>&copy; {o.omistaja}</a>&nbsp;
                            {lisenssi} {metatieto} {latauspvm} {lisatieto}
                        </List.Description>
                    </List.Content>
                </List.Item>
            );
        }

        let accs = [];
        [
            BACKGROUND,
            CATCHMENT_ACTIONS, LAKE_ACTIONS, MONITORING,
            LAKE, CATCHMENT, LAKE_BATHYMETRY,
            ACTIONS, RIGHTS, FUNDERS, FEEDBACK
        ].forEach((i) => {
             let isActive = this.state.activeIndex === i || this.state.active.indexOf(i) !== -1;
             let color = isActive ? 'teal' : 'grey';
             accs.push(
                     <Accordion.Title active={isActive} index={i} onClick={this.handleClick} key={key}>
                         <Icon name='dropdown' />
                         <Label color={color}>{leafs[i].title}</Label>
                     </Accordion.Title>
             );
             key++;
             let content;
             switch (i) {
             case ACTIONS:
                 content = <Accordion panels={kuvaukset} />;
                 break;
             case RIGHTS:
                 content = <List>{oikeudet}</List>;
                 break;
             case FUNDERS:
                 content = <div className="flags">{flags}</div>;
                 break;
             case FEEDBACK:
                 content =
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
                         placeholder='Palaute *'
                         value={this.state.palaute}
                         onChange={this.feedbackChanged}
                         name='feedback' />
                     * = Pakollinen tieto<br/>
                     <Button>Lähetä</Button>
                 </Form>;
                 break;
             default:
                 content =
                 <div className="left-para">
                     {leafs[i].layers}
                 </div>;
             }
             accs.push(
                 <Accordion.Content active={isActive} key={key}>
                    {content}
                </Accordion.Content>
             );
             key++;
        });

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
                    {accs}
                </Accordion>
            </div>
        );
    }

}

const mapStateToProps = (state) => {
    return {
        leafs: state.init.leafs,
        popup: state.init.popup,
        layers: state.init.layers,
        lakes: state.init.lakes,
        features: state.init.features,
        backgrounds: state.init.backgrounds,
        flags: state.init.flags,
        oikeudet: state.init.oikeudet,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(LeftPanel);
