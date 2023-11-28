import React, { Component, useRef, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { connect } from 'react-redux';
import { Header, Table } from 'semantic-ui-react';
import { MapContainer, useMap, TileLayer, GeoJSON, Popup,
         Polygon, Polyline, Tooltip, ScaleControl
       } from 'react-leaflet';
import './MyMap.css';
import { ESTATES } from '../actions/initAction';

export const make_popup_contents = (popup, feature) => {
    let items = [];
    let show = false;
    if (feature.properties.kohdetyyppi === 'Vesijärveen laskevien jokien valuma-alueita'
        && feature.properties.nimi === 'Hammonjoen va') {
        //console.log('popup',popup);
        /*
        for (let p of Object.values(popup)) {
            console.log('popup', p.sarake, p);
        }
        */
        console.log('feature',feature);
        show = true;
    }
    let title = feature.properties.nimi;
    let header = (
        <Header as='h4'>
          <Header.Content>
            {title}
            <Header.Subheader>Human Resources</Header.Subheader>
          </Header.Content>
        </Header>
    );
    let images = '';
    for (let i = 0; i < popup.length; i++) {
        let otsikko = popup[i].otsikko;
        let sarake = popup[i].sarake;
        let value = feature.properties[sarake];
        let typeOfValue = typeof value;
        if (!value) {
            continue;
        } else {
            value = String(value);
        }
        if (show) console.log(sarake,otsikko,value,typeOfValue);
        if (otsikko === 'kuvat') {
            images = [];
            let filenames = value.split(/,/);
            //console.log(value,filenames.length);
            for (let i = 0; i < filenames.length; i++) {
                let name = filenames[i];
                let src = name, scale = false;
                if (name.substring(0,7) === "http://" || name.substring(0,8) === "https://") {
                    let regex = /\(([\d%]+)\)$/;
                    let m = src.match(regex);
                    if (m) {
                        src = src.replace(m[0], '');
                        scale = m[1];
                    }
                } else {
                    src = process.env.PUBLIC_URL + '/media/' + name;
                }
                if (/mp4/.test(name)) {
                    let poster = name.match(/(\w+).mp4$/);
                    poster = process.env.PUBLIC_URL + '/media/' + poster[1] + '.jpeg';
                    images.push(
                        <div key={2000+i}>
                          <video width='270' height='200' controls={true} preload='none' poster={poster}>
                            <source src={src} type='video/mp4'></source>
                          </video>
                          Videon lataus voi kestää hetken.
                        </div>
                    );
                } else {
                    if (scale) {
                      images.push(
                          <img src={src} alt={src} width={scale} height={scale} key={2000+i}></img>
                      );
                    } else {
                        images.push(
                            <img src={src} alt={src} key={2000+i}></img>
                        );
                    }
                }
            }
            continue;
        } else if (otsikko === 'Tyyppi') {
            header = (
                <Header as='h4'>
                  <Header.Content>
                    {title}
                    <Header.Subheader>{value}</Header.Subheader>
                  </Header.Content>
                </Header>
            );
            continue;
        }
        if (sarake === 'pinta_ala' && !(value.includes('km') || value.includes('ha'))) {
            value = value.replace('.', ',') + ' km';
            value = <div>{value}<sup>2</sup></div>;
        } else if (value.startsWith('http')) {
            value = <a href={value} target='_blank' rel='noreferrer'>{otsikko}</a>;
        } else if (value.includes('href')) {
            let m = /<a (.*)?<\/a>/.exec(value);
            let href = /href="(.*)?" /.exec(m[1]);
            let t = />(.*)?</.exec(m[0]);
            let x = value.replace(m[0], '|').split('|');
            value = <div>{x[0]}<a href={href[1]} target='_blank' rel='noreferrer'>{t[1]}</a>{x[1]}</div>;
        }
        items.push(
            <Table.Row key={1000+i}>
              <Table.Cell>{otsikko}</Table.Cell>
              <Table.Cell>{value}</Table.Cell>
            </Table.Row>
        );
    }
    return (
        <div>
          {header}
          <Table>
            <Table.Body>
              {items}
            </Table.Body>
          </Table>
          {images}
        </div>
    );
};

let map = null;

export function flyTo(latlng) {
    //console.log('flyTo', latlng);
    map.flyTo(latlng);
}

export function getMapZoom() {
    //console.log('map at', map._zoom, map._lastCenter);
    //console.log('map at', map);
}

export function setZoom(zoom) {
    //console.log('setZoom', zoom);
    map.setZoom(zoom);
}

export function setView(latlng, zoom) {
    //console.log('set view', latlng, zoom);
    map.setView(latlng, zoom);
}

export function fitBounds(bounds) {
    //console.log('fitBounds', bounds);
    map.fitBounds(bounds);
}

export function UseMap() {
    map = useMap();
}

const HilitePolygon = (props) => {
    const polygonRef = useRef();
    const eventHandlers = useMemo(
        () => ({
            mouseover() {
                polygonRef.current.setStyle({fillColor: "yellow"});
            },
            mouseout() {
                polygonRef.current.setStyle({fillColor: props.fill_color});
            }
        }),
        [props.fill_color]
    );
    console.log(props);
    return (
        <Polygon ref={polygonRef}
                 eventHandlers={eventHandlers}
                 fillColor={props.fillColor}
                 fillOpacity={props.fillOpacity}
                 stroke={props.stroke}
                 opacity={props.opacity}
                 color={props.color}
                 positions={props.polygon}>
          <Tooltip><div style={{ backgroundColor: 'yellow', fontWeight: 'bolder'}}>{props.tooltip}</div></Tooltip>
        </Polygon>
    );
}

class MyMap extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    make_popup = (feature) => {
        let contents = make_popup_contents(this.props.popup, feature);
        return <Popup isDraggable={true}>{contents}</Popup>;
    }

    key = 1;

    set_bg = (layers) => {
        for (let i = 0; i < this.props.backgrounds.length; i++) {
            let bg = this.props.backgrounds[i];
            if (bg.visible) {
                layers.push(
                    <TileLayer key={this.key}
                               attribution={bg.attribution}
                               url={bg.url}/>);
                this.key++;
                break;
            }
        }
    }

    add_overlays = (layers) => {
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (layer.visible && layer.table.startsWith('https')) {
                //console.log('overlay',layer);
                layers.push(
                    <TileLayer
                        key={this.key}
                        attribution=''
                        tms='true'
                        opacity={layer.opacity}
                        url={layer.table}
                    />);
            }
            this.key++;
        }
    }

    add_estates = (layers) => {
        let layer = null;
        for (let i = 0; i < this.props.layers.length; i++) {
            if (this.props.layers[i].klass === ESTATES) {
                layer = this.props.layers[i];
                break;
            }
        }
        if (!layer) {
            this.key += 20*40;
            return;
        }
        console.log('estates layer',layer);
        let estates = layer.features.features;
        console.log('estates',estates);
        for (let i = 0; i < estates.length; i++) {
            let estate = estates[i];
            if (estate.geometry && estate.visible) {
                let coordinates = estate.geometry.coordinates;
                let multiPolygon = [];
                for (let k = 0; k < coordinates.length; k++) {
                    let ps = coordinates[k];
                    let polygon = [];
                    for (let j = 0; j < ps.length; j++) {
                        polygon.push(ps[j]);
                    }
                    multiPolygon.push(polygon);
                }
                layers.push(<HilitePolygon
                              key={this.key}
                              polygon={multiPolygon}
                              stroke={true}
                              color={layer.stroke_color}
                              opacity={layer.opacity}
                              fillColor={layer.fill_color}
                              fillOpacity={layer.fill_opacity}
                              tooltip={estate.properties.nimi}
                            />);
                this.key++;
                
            }
        }
    }

    add_bathymetry = (layers) => {
        let lakes = this.props.lakes;
        if (!lakes) {
            this.key += 20*40;
            return;
        }
        for (let i = 0; i < lakes.features.features.length; i++) {
            let lake = lakes.features.features[i];
            //console.log('lake',lake);
            if (lake.bathymetry && lake.show_bathymetry) {
                //console.log('add lake bathymetry',lake);
                let fill_opacity = lake.properties.fill_opacity;
                let stroke = false;
                for (let k = 0; k < lake.bathymetry.length; k++) {
                    let ps = lake.bathymetry[k];
                    let polygon = [];
                    for (let j = 0; j < ps.length; j++) {
                        polygon.push(ps[j]);
                    }
                    layers.push(
                        <Polygon key={this.key}
                                 fillColor="blue"
                                 fillOpacity={fill_opacity}
                                 stroke={stroke}
                                 opacity={fill_opacity}
                                 positions={polygon}>
                        </Polygon>
                    );
                    this.key++;
                }
            }
        }
    }

    add_river = (layers, layer) => {
        let c = layer.features.coordinates;
        let p = layer.features.properties;
        for (let k = 0; k < c.length; k++) {
            let ps = c[k];
            let polyline = [];
            for (let j = 0; j < ps.length; j++) {
                polyline.push(ps[j]);
            }
            layers.push(
                <Polyline key={this.key}
                          stroke="true"
                          color={layer.stroke_color}
                          weight={layer.stroke_width}
                          opacity={layer.opacity}
                          positions={polyline}>
                  <Tooltip>{p[k].nimi}</Tooltip>
                </Polyline>
            );
            this.key++;
        }
    }

    add_lake = (layers, layer) => {
        let c = layer.features.coordinates;
        let p = layer.features.properties;
        for (let k = 0; k < c.length; k++) {
            let ps = c[k];
            let polygon = [];
            for (let j = 0; j < ps.length; j++) {
                polygon.push(ps[j]);
            }
            let tooltip = '';
            if (p[k].nimi) {
                tooltip = <Tooltip>{p[k].nimi}</Tooltip>;
            }
            let fill_color = layer.fill_color;
            if (p[k].fill_color) {
                fill_color = p[k].fill_color;
            }
            let popup = null;
            let onClick = null;
            let feature = {
                properties: p[k],
            };
            if (layer.popup) {
                popup = this.make_popup(feature);
            }
            let overlay = <Polygon key={this.key}
                                   fillColor={fill_color}
                                   fillOpacity={layer.fill_opacity}
                                   stroke="true"
                                   color={layer.stroke_color}
                                   weight={layer.stroke_width}
                                   opacity={layer.opacity}
                                   onClick={onClick}
                                   positions={polygon}>
                            {tooltip}
                            {popup}
                          </Polygon>;
            layers.push(overlay);
            this.key++;
        }
    }

    add_rivers_and_lakes = (layers) => {
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (layer.klass === ESTATES) {
                continue;
            }
            //console.log(layer);
            let from_net = layer.table.substr(0, 4) === 'http';
            let features = layer.features;
            if (layer.visible && !from_net && features && features.coordinates) {
                if (layer.geometry_type === 'Polyline') {
                    this.add_river(layers, layer);
                } else if (layer.geometry_type === 'Polygon') {
                    this.add_lake(layers, layer);
                }
            } else {
                this.key += 200;
            }
        }
    }

    onEachFeature = (feature, layer) => {
        //console.log('on each f',map);
        let popup = make_popup_contents(this.props.popup, feature);
        layer.bindPopup(renderToString(popup));
    }

    add_actions = (layers) => {
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            let features = layer.features || [];
            let is_point = layer.geometry_type === 'Point';
            if (is_point && layer.visible && features) {
                //console.log(features);
                layers.push(
                    <GeoJSON key={this.key}
                             data={features}
                             pointToLayer={layer.style}
                             onEachFeature={this.onEachFeature}>
                    </GeoJSON>
                );
            }
            this.key++;
        }
    }

    render() {
        console.log('render map',this.props);
        this.key = 1;
        let layers = [];

        this.set_bg(layers);
        this.add_overlays(layers);
        this.add_estates(layers);
        this.add_bathymetry(layers);
        this.add_rivers_and_lakes(layers);
        this.add_actions(layers);

        return (
            <MapContainer
              ref={a => map = a}
              center={this.props.latlng}
              zoom={this.props.zoom}
              eventHandlers={this.on_ref}
              minZoom="9"
              maxZoom="18">
              {layers}
              <ScaleControl imperial="false"/>
            </MapContainer>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        latlng: state.init.latlng,
        zoom: state.init.zoom,
        popup: state.init.popup,
        layers: state.init.layers,
        lakes: state.init.lakes,
        features: state.init.features,
        selected_feature: state.init.selected_feature,
        backgrounds: state.init.backgrounds,
        focused: state.init.focused,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(MyMap);
