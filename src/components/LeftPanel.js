import React, { Component } from 'react';
import { renderToString } from 'react-dom/server';
import { Menu, Input, Accordion, Icon, List, Label, Form, TextArea, Button, Divider, Item, Checkbox } from 'semantic-ui-react';
import { connect } from 'react-redux';
import {
    BUTTONS, BG,
    CATCHMENT_ACTIONS, LAKE_ACTIONS, MONITORING, LAKE, CATCHMENT, BATHYMETRY,
    ACTIONS, RIGHTS, FUNDERS, FEEDBACK,
    hideLayer, hideLayers, showLayer, showLayers, hideLeaf, showLeaf,
    selectFeature,
    selectLake, unselectLake,
    selectBackground,
    getBathymetry, sendFeedback, setActive, setUnActive, setFocused }
from '../actions/initAction';
import { getBounds } from '../reducers/initReducer';
import L from 'leaflet';
import { mapsPlaceHolder } from '../index.js';
import { make_popup_contents, flyTo, setView, fitBounds } from './MyMap';
import MyModal from './Video';

import './LeftPanel.css';

class LeftPanel extends Component {

    constructor(props) {
        super(props);
        this.state = {
            topic: '',
            name: '',
            email: '',
            feedback: '',
            size: 'max',
        };
    }

    ToggleSize = (e) => {
        this.setState({
            size: this.state.size === 'min' ? 'max' : 'min'
        });
    }

    handleClick = (e, titleProps) => {
        const {klass} = titleProps;
        //console.log('click on leaf',klass);
        let a = 0;
        for (let leaf of Object.values(this.props.leafs)) {
            if (leaf.klass === klass) {
                a = leaf.active;
            }
        }
        if (a === 0) {
            this.props.dispatch(setActive(klass));
        } else {
            this.props.dispatch(setUnActive(klass));
        }
    }

    selectBackground = (e) => {
        let i = parseInt(e.target.id, 10);
        if (!this.props.backgrounds[i].visible) {
            this.props.dispatch(selectBackground(i));
        }
    }

    setBounds = () => {
        let bounds = null;
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            let is_point = layer.geometry_type === 'Point';
            let is_poly = layer.geometry_type === 'Polygon' || layer.geometry_type === 'Polyline';
            if (layer.table.startsWith('https')) {
                continue;
            }
            if (is_point && layer.visible && layer.features) {
                //console.log(layer);
                for (let i = 0; i < layer.features.features.length; i++) {
                    let feature = layer.features.features[i];
                    let point = feature.geometry.coordinates;
                    bounds = getBounds(feature.geometry.coordinates, bounds);
                }
            } else if (is_poly && layer.visible && layer.features) {
                //console.log(layer);
                let feature = layer.features;
                bounds = getBounds(feature.coordinates);
            }
            //console.log('setting bounds',bounds,layer.name,layer.table);
        }
        if (bounds) {
            //console.log('fit bounds',bounds);
            fitBounds(bounds);
        }
    }

    onLayerClick = (e) => {
        if (e.target.id === '') {
            return;
        }
        let index = e.target.id;
        //console.log('click on layer',index);
        if (index.includes('show')) {
            let klass = index.replace("show ", "");
            if (klass === BATHYMETRY && this.props.lakes) {
                for (let i = 0; i < this.props.lakes.features.features.length; i++) {
                    let lake = this.props.lakes.features.features[i];
                    if (lake && lake.properties.syvyyskartta && !lake.bathymetry) {
                        this.props.dispatch(getBathymetry(lake));
                    }
                }
            }
            this.props.dispatch(showLeaf(klass));
        } else if (index.includes('hide')) {
            let klass = index.replace("hide ", "");
            this.props.dispatch(hideLeaf(klass));
        } else if (this.props.layers[index].visible) {
            this.props.dispatch(hideLayer(index));
        } else {
            this.props.dispatch(showLayer(index));
        }
        if (this.props.focused) {
            this.setBounds();
        }
    }

    places = {}

    onChangeOfPlace = (e) => {
        if (this.places.hasOwnProperty(e.target.value)) {
            let index = this.places[e.target.value];
            let feature = this.props.features[index];
            let latlng = feature.latlng;
            let zoom = 13;
            setView(latlng, zoom);
            let popup = make_popup_contents(this.props.popup, feature);
            let content = renderToString(popup);
            L.popup()
                .setLatLng(latlng)
                .setContent(content)
                .openOn(mapsPlaceHolder[0]);
            this.props.dispatch(selectFeature(index));
            e.target.value = '';
        }
    }

    onClickOnLake = (e) => {
        let index = parseInt(e.target.id, 10);
        let lake = this.props.lakes.features.features[index];
        if (lake) {
            //console.log('click on lake',lake);
            if (lake.show_bathymetry) {
                this.props.dispatch(unselectLake(index));
            } else {
                if (!lake.bathymetry) {
                    this.props.dispatch(getBathymetry(lake));
                }
                this.props.dispatch(selectLake(index));
                if (this.props.focused) {
                    if (lake.bathymetry && lake.bathymetry_bounds) {
                        fitBounds(lake.bathymetry_bounds);
                    } else if (lake.geometry.coordinates) {
                        let c = lake.geometry.coordinates;
                        let latlng = [c[1], c[0]];
                        flyTo(latlng);
                    }
                }
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
        let url = process.env.PUBLIC_URL + '/media/' + legend;
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
                let url = process.env.PUBLIC_URL + '/media/' + image;
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

    onHideAll = (b, e) => {
        let visible = true;
        for (let layer of Object.values(this.props.layers)) {
            if (layer.klass === "buttons" && layer.table === "") {
                visible = layer.visible;
            }
        }
        //console.log('onHideAll',visible);
        if (visible) {
            this.props.dispatch(hideLayers());
        } else {
            this.props.dispatch(showLayers());
            if (this.props.focused) {
                this.setBounds();
            }
        }
    }

    toggleFocused = (focused) => {
        //console.log('toggle focused from', this.props.focused, 'to', focused);
        this.props.dispatch(setFocused(focused));
    }

    key = 0;

    add_layers = (layers) => {
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            let legend = layer.legend;
            let h = layer.graphic_height;
            let w = layer.graphic_width;
            let descr = '';
            let c = false;
            switch (layer.klass) {
            case BUTTONS:
                c = true;
                layers[layer.klass].layers.push(layer);
                break;
            case MONITORING:
            case LAKE_ACTIONS:
            case CATCHMENT_ACTIONS:
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
                c = true;
                break;
            }
            if (c) {
                continue;
            }
            if (layer.visible) {
                layers[layer.klass].hidden = false;
            } else if (legend) {
                legend = layer.legend_hidden;
            }
            let img = this.layer_legend(layer.visible, i, legend, h, w);
            let name = this.layer_name(layer.visible, i, layer.name);
            let div =
                <div key={this.key} onClick={this.onLayerClick} id={i} style={{cursor: 'pointer'}}>
                  {img} {name} <br/> {descr}
                </div>;
            layers[layer.klass].layers.push(div);
            this.key++;
        }
    }

    add_bg_maps = (layers) => {
        for (let i = 0; i < this.props.backgrounds.length; i++) {
            let bg = this.props.backgrounds[i];
            let legend = this.layer_legend(bg.visible, i);
            let name = this.layer_name(bg.visible, i, bg.otsikko);
            let descr = this.layer_descr(bg.visible, i, bg.kuvaus);
            layers['bg'].layers.push(
                <div key={this.key} onClick={this.selectBackground} id={i} style={{cursor: 'pointer'}}>
                  {legend} {name} <br/> {descr}
                </div>
            );
            this.key++;
        }
    }

    add_bathymetry = (layers) => {
        for (let i = 0; i < this.props.lakes.features.features.length; i++) {
            let lake = this.props.lakes.features.features[i];
            if (!lake.properties.syvyyskartta) {
                continue;
            }
            let visible = lake.show_bathymetry;
            if (visible) {
                layers[BATHYMETRY].hidden = false;
            }
            let img = this.layer_legend(visible, i);
            let name = this.layer_name(visible, i, lake.properties.nimi);
            let descr = this.layer_descr(visible, i, '', lake.properties.syvyyskartta + '.png');
            layers[BATHYMETRY].layers.push(
                <div key={this.key} onClick={this.onClickOnLake} id={i} style={{cursor: 'pointer'}}>
                  {img} {name} <br/> {descr}
                </div>
            );
            this.key++;
        }
    }

    add_show_hide = (layers) => {
        for (let [klass, layer] of Object.entries(layers)) {
            if (!layer.layers || klass === BG || klass === BUTTONS) {
                continue;
            }
            let imgUrl, name, id;
            if (layer.hidden) {
                id = 'show ' + klass;
                imgUrl = process.env.PUBLIC_URL + '/media/yes.svg';
                name = <span id={id} className="">Näytä kaikki {layer.title}</span>;
            } else {
                imgUrl = process.env.PUBLIC_URL + '/media/no.svg';
                id = 'hide ' + klass;
                name = <span id={id} className="">Piilota kaikki {layer.title}</span>;
            }
            let div =
                <div key={this.key} onClick={this.onLayerClick} id={id} style={{cursor: 'pointer'}}>
                    <img alt="" src={imgUrl} height={21} width={21} id={id}/> {name}
                </div>;
            layer.layers.unshift(div);
            this.key++;
        }
    }

    get_datalist = () => {
        let datalist = [];
        for (let i = 0; i < this.props.features.length; i++) {
            let name = this.props.features[i].properties.nimi;
            this.places[name] = i;
            datalist.push(<option value={name} key={this.key} />);
            this.key++;
        }
        return datalist;
    }

    get_flags = () => {
        let flags = [];
        if (this.props.flags) {
            for (let i = 0; i < this.props.flags.length; i++) {
                let flag = this.props.flags[i];
                flags.push(
                    <a key={this.key} href={flag.url} target="_blank" rel="noopener noreferrer">
                        <img src={flag.img_url} alt={flag.alt} width="250"/>
                    </a>
                );
                this.key++;
            }
        }
        return flags;
    }

    get_kuvaukset = () => {
        let kuvaukset = [];
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if ((layer.klass === CATCHMENT_ACTIONS || layer.klass === LAKE_ACTIONS) && layer.kuvaus) {
                let parts = layer.kuvaus.split(";");
                let content = [];
                for (let j = 0; j < parts.length; j++) {
                    //console.log(parts[j]);
                    if (parts[j].substr(0, 4) === 'http') {
                        content.push(
                            <p key={this.key} className="left-para">
                                <a target="info" href={parts[j]}>(Lähde)</a>
                            </p>);
                    } else {
                        content.push(<p key={this.key} className="left-para">{parts[j]}</p>);
                    }
                    this.key++;
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
        return kuvaukset;
    }

    get_oikeudet = () => {
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
        return oikeudet;
    }

    add_buttons = (items, buttons) => {
        //console.log('focused is', this.props.focused);
        //console.log('buttons',buttons.layers.sort((a,b) => a.id - b.id));
        for (let layer of buttons.layers.sort((a,b) => a.id - b.id)) {
            let yt = 'YouTube://';
            if (layer.table.startsWith(yt)) {
                let video = layer.table.replace(yt, '');
                items.push(
                    <Item key={this.key}>
                      <Item.Content>
                        <MyModal video={video}
                                 label={layer.label}
                                 header={layer.kuvausotsikko}
                                 otsikko={layer.otsikko}
                                 kuvaus={layer.kuvaus}/>
                      </Item.Content>
                    </Item>
                );
            } else if (layer.legend === 'Checkbox') {
                items.push(
                    <Checkbox
                      label={layer.name}
                      onChange={(e, data) => this.toggleFocused(data.checked)}
                      checked={this.props.focused}
                      key={this.key+1}
                    />
                );
            } else {
                let words = layer.name.split(' | ');
                let t = layer.visible ? words[0] : words[1];
                items.push(
                    <Item key={this.key}>
                      <Item.Content>
                        <Button onClick={this.onHideAll} key={this.key+2}>{t}</Button>
                      </Item.Content>
                    </Item>
                );
            }
            this.key += 3;
        }
    }

    render() {

        if (!this.props.leafs || this.props.layers.length === 0) {
          return <br/>;
        }
        
        if (this.state.size === 'min') {
            return (
                <div className="LeftPanelMinimized" align="left">
                  <Icon name='angle double right' onClick={this.ToggleSize} />
                </div>
            );
        }

        //console.log('leafs', this.props.leafs);
        //console.log('layers', this.props.layers);

        let layers = {};
        for (let leaf of Object.values(this.props.leafs)) {
            layers[leaf.klass] = {
                layers: [],
                active: leaf.active > 0,
                hidden: true,
                title: leaf.title.toLowerCase(),
            };
        }
        //console.log('layers', layers);

        this.key = 0;
        this.add_bg_maps(layers);
        this.add_layers(layers);
        if (this.props.lakes) {
            this.add_bathymetry(layers);
        }
        this.add_show_hide(layers);
        let datalist = this.get_datalist();
        let flags = this.get_flags();
        let kuvaukset = this.get_kuvaukset();
        let oikeudet = this.get_oikeudet();

        let items = [];
        let accs = [];
        for (let leaf of Object.values(this.props.leafs)) {
            if (leaf.klass === BUTTONS) {
                this.add_buttons(items, layers[leaf.klass]);
                continue;
            }
            let active = leaf.active > 0;
            let color = active ? 'teal' : 'grey';
            accs.push(
                <Accordion.Title active={active} klass={leaf.klass} onClick={this.handleClick} key={this.key}>
                       <Icon name='dropdown' />
                  <Label color={color}>{leaf.title}</Label>
                </Accordion.Title>
            );
            this.key++;
            let content;
            switch (leaf.klass) {
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
                      {layers[leaf.klass].layers}
                    </div>;
            }
            accs.push(
                <Accordion.Content active={active} key={this.key}>
                  {content}
                </Accordion.Content>
            );
            this.key++;
        };

        return (
            <div className="LeftPanel" align="left">
              <Menu.Item>
                <Input list='places'
                       className='icon'
                       icon='search'
                       placeholder='Hae...'
                       onChange={this.onChangeOfPlace} />
                &nbsp;&nbsp;<Icon name='angle double left' onClick={this.ToggleSize} />
                <datalist id='places'>{datalist}</datalist>
              </Menu.Item>

              <Divider />
              <Item.Group>{items}</Item.Group>
              <Divider />

              <Accordion exclusive={false}>{accs}</Accordion>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        latlng: state.init.latlng,
        zoom: state.init.zoom,
        klasses: state.init.klasses,
        leafs: state.init.leafs,
        popup: state.init.popup,
        layers: state.init.layers,
        lakes: state.init.lakes,
        features: state.init.features,
        backgrounds: state.init.backgrounds,
        flags: state.init.flags,
        oikeudet: state.init.oikeudet,
        focused: state.init.focused,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(LeftPanel);
