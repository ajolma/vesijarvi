import React, { Component } from 'react';
import { Menu, Input, Accordion, Icon, List, Label, Form, TextArea, Button, Divider, Item, Checkbox
       } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { BUTTONS,
         CATCHMENT_ACTIONS, LAKE_ACTIONS, MONITORING, LAKES, CATCHMENT,
         ACTIONS, RIGHTS, FUNDERS, FEEDBACK,
         hideLayer, hideLayers, showLayer, showLayers, hideLeaf, showLeaf,
         selectFeature,
         selectBackground,
         getFeatureGeometry, sendFeedback, setActive, setUnActive, setFocused,
         showFeature, hideFeature,
         fitBoundsFinally
       } from '../actions/initAction';
import { setBounds } from '../reducers/initReducer';
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

    toggleSize = (e) => {
        let is_min = this.state.size === 'min';
        this.setState({
            size: is_min ? 'max' : 'min'
        });
        setBounds(this.props.layers, !is_min);
    }

    onHideAll = (b, e) => {
        let visible = true;
        for (let layer of this.props.layers) {
            if (layer.klass === BUTTONS && layer.legend === 'HideButton') {
                visible = layer.visible;
            }
        }
        if (visible) {
            this.props.dispatch(hideLayers());
        } else {
            this.props.dispatch(showLayers());
            if (this.props.focused) {
                setBounds(this.props.layers);
            }
        }
    }

    toggleFocused = (focused) => {
        this.props.dispatch(setFocused(focused));
    }

    selectBackground = (e) => {
        let i = parseInt(e.target.id, 10);
        if (!this.props.backgrounds[i].visible) {
            this.props.dispatch(selectBackground(i));
        }
    }

    handleClick = (e, titleProps) => {
        const {klass} = titleProps;
        if (!this.props.leafs[klass].active) {
            this.props.dispatch(setActive(klass));
        } else {
            this.props.dispatch(setUnActive(klass));
        }
    }

    onLeafShowHideClick = (e) => {
        if (e.target.id === '') {
            return;
        }
        let klass = e.target.id;
        let visible = false;
        for (let layer of this.props.layers) {
            if (layer.klass === klass) {
                if (this.props.leafs[klass].contents === 'features') {
                    for (let feature of layer.features.features) {
                        if (feature.visible) {
                            visible = true;
                            break;
                        }
                    }
                } else {
                    if (layer.visible) {
                        visible = true;
                        break;
                    }
                }
            }
        }
        if (visible) {
            this.props.dispatch(hideLeaf(klass));
        } else {
            for (let layer of this.props.layers) {
                this.props.dispatch(fitBoundsFinally());
                if (layer.klass === klass && this.props.leafs[klass].contents === 'features') {
                    for (let feature of layer.features.features) {
                        if (!feature.geometry) {
                            this.props.dispatch(getFeatureGeometry(feature, klass));
                        }
                    }
                }
            }
            this.props.dispatch(showLeaf(klass));
        }
    }

    onLayerClick = (e) => {
        let layer;
        for (layer of this.props.layers) {
            if (layer.id === e.target.id) {
                break;
            }
        }
        if (!layer) {
        } else if (layer.visible) {
            this.props.dispatch(hideLayer(layer));
        } else {
            this.props.dispatch(showLayer(layer));
            if (this.props.focused) {
                setBounds(this.props.layers);
            }
        }
    }

    onClickOnFeature = (e) => {
        let klass = e.target.getAttribute('klass');
        let index = parseInt(e.target.id, 10);
        for (let layer of this.props.layers) {
            if (layer.klass === klass) {
                let feature = layer.features.features[index];
                if (!feature.geometry) {
                    this.props.dispatch(getFeatureGeometry(feature, klass));
                }
                if (feature.visible) {
                    this.props.dispatch(hideFeature(layer.klass, feature));
                    if (this.props.focused) {
                        setBounds(this.props.layers);
                    }
                } else {
                    this.props.dispatch(showFeature(layer.klass, feature));
                    if (this.props.focused) {
                        setBounds(this.props.layers);
                    }
                }
                break;
            }
        }
    }

    places = {}

    onChangeOfPlace = (e) => {
        if (e.target.value !== '' && this.places.hasOwnProperty(e.target.value)) {
            let index = this.places[e.target.value];
            let feature = this.props.features[index];
            console.log(index,feature);
            if (!feature.geometry) {
                this.props.dispatch(
                    getFeatureGeometry(
                        feature, feature.layer.klass,
                        (feature) => {
                            this.props.dispatch(selectFeature(feature));
                        })
                );
            } else {
                this.props.dispatch(selectFeature(feature));
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

    key = 0;

    add_layers = () => {
        for (let layer of this.props.layers) {
            let leaf = this.props.leafs[layer.klass];
            let legend = layer.visible ? layer.legend : layer.legend_hidden;
            let h = layer.graphic_height;
            let w = layer.graphic_width;
            let descr = '';
            let c = false;
            switch (layer.klass) {
            case BUTTONS:
                c = true;
                leaf.layers.push(layer);
                break;
            case CATCHMENT_ACTIONS:
            case LAKE_ACTIONS:
            case MONITORING:
                leaf.add_show_hide = true;
                if (layer.visible) {
                    leaf.layers_visible = true;
                }
                break;
            case CATCHMENT:
            case LAKES:
                leaf.add_show_hide = true;
                if (layer.visible) {
                    leaf.layers_visible = true;
                }
                if (!layer.legend_hidden) {
                    descr = this.layer_descr(layer.visible, layer.id, layer.kuvaus, legend, h, w);
                    legend = null;
                } else {
                    descr = this.layer_descr(layer.visible, layer.id, layer.kuvaus);
                }
                break;
            default:
                if (this.props.leafs[layer.klass].contents === 'features') {
                    leaf.add_show_hide = true;
                    for (let feature of layer.features.features) {
                        if (feature.visible) {
                            leaf.layers_visible = true;
                            break;
                        }
                    }
                }
                c = true;
                break;
            }
            if (c) {
                continue;
            }
            let img = this.layer_legend(layer.visible, layer.id, legend, h, w);
            let name = this.layer_name(layer.visible, layer.id, layer.name);
            let div =
                <div key={this.key} onClick={this.onLayerClick} id={layer.id} style={{cursor: 'pointer'}}>
                  {img} {name} <br/> {descr}
                </div>;
            leaf.layers.push(div);
            this.key++;
        }
    }

    add_buttons = (items, leaf) => {
        for (let layer of leaf.layers.sort((a,b) => a.id - b.id)) {
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

    add_bg_maps = () => {
        for (let i = 0; i < this.props.backgrounds.length; i++) {
            let bg = this.props.backgrounds[i];
            let legend = this.layer_legend(bg.visible, i);
            let name = this.layer_name(bg.visible, i, bg.otsikko);
            let descr = this.layer_descr(bg.visible, i, bg.kuvaus);
            this.props.leafs['bg'].layers.push(
                <div key={this.key} onClick={this.selectBackground} id={i} style={{cursor: 'pointer'}}>
                  {legend} {name} <br/> {descr}
                </div>
            );
            this.key++;
        }
    }

    add_layers_from_features = (klass) => {
        for (let layer of this.props.layers) {
            if (layer.klass === klass) {
                let features = layer.features.features;
                for (let i = 0; i < features.length; i++) {
                    let feature = features[i];
                    let img = this.layer_legend(feature.visible, feature.id);
                    this.props.leafs[klass].layers.push(
                        <div key={this.key}
                             onClick={this.onClickOnFeature}
                             klass={klass}
                             id={i}
                             style={{cursor: 'pointer'}}>
                          {img} {feature.properties.nimi}
                        </div>
                    );
                    this.key++;
                }
                break;
            }
        }
    }

    add_show_hide = () => {
        for (let [klass, leaf] of Object.entries(this.props.leafs)) {
            if (leaf.add_show_hide) {
                let imgUrl, name, id;
                if (leaf.layers_visible) {
                    imgUrl = process.env.PUBLIC_URL + '/media/no.svg';
                    id = klass;
                    name = <span id={id} className="">Piilota kaikki</span>; // {leaf.lc_title}
                } else {
                    id = klass;
                    imgUrl = process.env.PUBLIC_URL + '/media/yes.svg';
                    name = <span id={id} className="">Näytä kaikki</span>;
                }
                let div =
                    <div key={this.key} onClick={this.onLeafShowHideClick} id={id} style={{cursor: 'pointer'}}>
                      <img alt="" src={imgUrl} height={21} width={21} id={id}/> {name}
                    </div>;
                leaf.layers.unshift(div);
                this.key++;
            }
        }
    }

    get_datalist = () => {
        let exists = {};
        let datalist = [];
        for (let i = 0; i < this.props.features.length; i++) {
            let name = this.props.features[i].properties.nimi;
            if (!exists[name]) {
                this.places[name] = i;
                datalist.push(<option value={name} key={this.key} />);
                this.key++;
            }
            exists[name] = 1;
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

                let s = String(o.lisatieto);
                if (s.includes('href')) {
                    let m = /<a (.*)?<\/a>/.exec(s);
                    let href = /href="(.*)?"/.exec(m[1]);
                    let t = />(.*)?</.exec(m[0]);
                    let x = s.replace(m[0], '|').split('|');
                    s = <div>{x[0]}<a href={href[1]} target='_blank' rel='noreferrer'>{t[1]}</a>{x[1]}</div>;
                }
                
                lisatieto = <span>{s}</span>;
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

    render() {

        if (!this.props.leafs || this.props.layers.length === 0) {
          return <br/>;
        }
        
        if (this.state.size === 'min') {
            return (
                <div className="LeftPanelMinimized" align="left">
                  <Icon name='angle double right' onClick={this.toggleSize} />
                </div>
            );
        }

        for (let leaf of Object.values(this.props.leafs)) {
            leaf.layers = [];
            leaf.layers_visible = false;
        }

        this.key = 0;
        let items = [];
        this.add_layers();
        this.add_buttons(items, this.props.leafs[BUTTONS]);
        this.add_bg_maps();
        for (let klass of Object.keys(this.props.leafs)) {
            if (this.props.leafs[klass].contents === 'features') {
                this.add_layers_from_features(klass);
            }
        }
        this.add_show_hide();
        let datalist = this.get_datalist();
        let flags = this.get_flags();
        let kuvaukset = this.get_kuvaukset();
        let oikeudet = this.get_oikeudet();

        let accs = [];
        let sorted = Object.values(this.props.leafs).sort(function(a, b) {return a.order - b.order;});
        for (let leaf of sorted) {
            if (leaf.contents === 'widgets') {
                continue;
            }
            let active = leaf.active > 0;
            let color = active ? 'teal' : leaf.color;
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
                      {leaf.layers}
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
                &nbsp;&nbsp;<Icon name='angle double left' onClick={this.toggleSize} />
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
        features: state.init.features,
        backgrounds: state.init.backgrounds,
        flags: state.init.flags,
        oikeudet: state.init.oikeudet,
        focused: state.init.focused,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(LeftPanel);
