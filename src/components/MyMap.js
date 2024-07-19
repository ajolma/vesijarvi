import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';
import React, { Component, useRef, useMemo } from 'react';
import { connect } from 'react-redux';
import { Header, Table } from 'semantic-ui-react';
import { MapContainer, useMap, TileLayer, Popup,
         Polygon, Polyline, Tooltip, ScaleControl, Marker
       } from 'react-leaflet';
import './MyMap.css';
import { LAKES, CATCHMENT, CATCHMENTS, CATCHMENTS2, BATHYMETRIES, ESTATES } from '../actions/initAction';

export const make_popup_contents = (popup, feature) => {
    let items = [];
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
        if (!value) {
            continue;
        } else {
            value = String(value);
        }
        if (otsikko === 'kuvat') {
            images = [];
            let filenames = value.split(/,/);
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
                        <div key={uuidv4()}>
                          <video width='270' height='200' controls={true} preload='none' poster={poster}>
                            <source src={src} type='video/mp4'></source>
                          </video>
                          Videon lataus voi kestää hetken.
                        </div>
                    );
                } else {
                    if (scale) {
                      images.push(
                          <img src={src} alt={src} width={scale} height={scale} key={uuidv4()}></img>
                      );
                    } else {
                        images.push(
                            <img src={src} alt={src} key={uuidv4()}></img>
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
            let href = /href="(.*)?"/.exec(m[1]);
            let t = />(.*)?</.exec(m[0]);
            let x = value.replace(m[0], '|').split('|');
            value = <div>{x[0]}<a href={href[1]} target='_blank' rel='noreferrer'>{t[1]}</a>{x[1]}</div>;
        }
        items.push(
            <Table.Row key={uuidv4()}>
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
    map.flyTo(latlng);
}

export function getMapZoom() {
    //console.log('map at', map._zoom, map._lastCenter);
    //console.log('map at', map);
}

export function setZoom(zoom) {
    map.setZoom(zoom);
}

export function setView(latlng, zoom) {
    map.setView(latlng, zoom);
}

export function fitBounds(bounds, full) {
    let xpad = full ? 40 : 250;
    map.fitBounds(bounds, {
        paddingBottomRight: [xpad, 0],
    });
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

    set_bg = (layers) => {
        for (let bg of this.props.backgrounds) {
            if (bg.visible) {
                layers.push(
                    <TileLayer key={1}
                               attribution={bg.attribution}
                               url={bg.url}/>);
                break;
            }
        }
    }

    add_overlays = (layers) => {
        for (let layer of this.props.layers) {
            if (layer.visible && layer.table && layer.table.startsWith('https')) {
                layers.push(
                    <TileLayer
                        key={uuidv4()}
                        attribution=''
                        tms='true'
                        opacity={layer.opacity}
                        url={layer.table}
                    />);
            }
        }
    }

    add_estates = (layers) => {
        for (let layer of this.props.layers) {
            if (layer.klass === ESTATES) {
                for (let feature of layer.features.features) {
                    if (feature.geometry && feature.visible) {
                        let coordinates = feature.geometry.coordinates;
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
                                      key={uuidv4()}
                                      polygon={multiPolygon}
                                      stroke={true}
                                      color={layer.stroke_color}
                                      opacity={layer.opacity}
                                      fillColor={layer.fill_color}
                                      fillOpacity={layer.fill_opacity}
                                      tooltip={feature.properties.nimi}
                                    />);
                    }
                }
                break;
            }
        }
    }

    add_bathymetry = (layers) => {
        for (let layer of this.props.layers) {
            if (layer.klass === BATHYMETRIES) {
                for (let bathymetry of layer.features.features) {
                    if (bathymetry.geometry && bathymetry.visible) {
                        let fill_opacity = bathymetry.properties.fill_opacity;
                        let syvyydet = [];
                        if (bathymetry.properties.syvyydet) {
                            syvyydet = bathymetry.properties.syvyydet.split(" ");
                        }
                        let i = 0;
                        for (let coords of bathymetry.geometry.coordinates) {
                            let syvyys = syvyydet[i];
                            i++;
                            layers.push(
                                <Polygon key={uuidv4()}
                                         fillColor="blue"
                                         fillOpacity={fill_opacity}
                                         color="black"
                                         stroke="true"
                                         opacity={fill_opacity}
                                         positions={coords}>
                                  <Popup isDraggable={true}><p>syvyys={syvyys} m</p></Popup>
                                </Polygon>
                            );
                        }
                    }
                }
                break;
            }
        }
    }

    add_river = (layers, layer, feature) => {
        let p = feature.properties;
        let overlay = <Polyline key={uuidv4()}
                                stroke="true"
                                color={layer.stroke_color}
                                weight={layer.stroke_width}
                                opacity={layer.opacity}
                                positions={feature.geometry.coordinates}>
                        <Tooltip>{p.nimi}</Tooltip>
                      </Polyline>;
        layers.push(overlay);
    }

    add_lake = (layers, layer, feature) => {
        let p = feature.properties;
        //console.log(p);
        let fill_color = p.fill_color || layer.fill_color;
        let fill_opacity = layer.fill_opacity || 0.0;
        let tooltip = p.nimi || p.name || p.kohdetyyppi;
        let popup = layer.popup ? this.make_popup(feature) : null;
        let overlay = <Polygon key={uuidv4()}
                               stroke="true"
                               color={layer.stroke_color}
                               weight={layer.stroke_width}
                               opacity={layer.opacity}
                               fillColor={fill_color}
                               fillOpacity={fill_opacity}
                               positions={feature.geometry.coordinates}>
                        <Tooltip>{tooltip}</Tooltip>
                        {popup}
                      </Polygon>;
        layers.push(overlay);
    }

    add_rivers_and_lakes = (layers) => {
        for (let layer of this.props.layers) {
            if (layer.klass === CATCHMENT) {
                let from_net = layer.table.substr(0, 4) === 'http';
                if (!layer.visible || from_net) {
                    continue;
                }
                for (let feature of layer.features.features) {
                    if (feature.geometry.type === 'Polyline') {
                        this.add_river(layers, layer, feature);
                    } else if (feature.geometry.type === 'Polygon') {
                        this.add_lake(layers, layer, feature);
                    }
                }
            }
        }
    }

    add_actions = (layers) => {
        for (let layer of this.props.layers) {
            let icon = null, icon_per_feature = false;
            if (layer.legend && (layer.legend.includes('.svg') || layer.legend.includes('.png'))) {
                icon = L.icon({
                    iconUrl: process.env.PUBLIC_URL + '/media/' + layer.legend,
                    iconSize: [layer.graphic_width, layer.graphic_height]
                });
            } else if (layer.legend === 'kohteesta') {
                icon_per_feature = true;
            } else {
                continue;
            }
            if (layer.visible && layer.geometry_type === 'Point') {
                for (let feature of layer.features.features) {
                    if (icon_per_feature) {
                        let html = feature.properties.nimi;
                        icon = L.divIcon({
                            className: 'my-div-icon',
                            html: html,
                        });
                    }
                    let popup = make_popup_contents(this.props.popup, feature);
                    layers.push(
                        <Marker key={uuidv4()}
                                position={feature.geometry.coordinates}
                                icon={icon}
                        >
                          <Popup>{popup}</Popup>
                        </Marker>);
                }
            }
        }
    }

    render() {
        let layers = [];

        this.set_bg(layers);
        this.add_overlays(layers);

        for (let layer of this.props.layers) {
            if (layer.klass === CATCHMENTS || layer.klass === CATCHMENTS2 || layer.klass === LAKES) {
                let visible = layer.visible;
                for (let feature of layer.features.features) {
                    if (layer.leaf.contents === 'features') {
                        visible = feature.visible;
                    }
                    if (feature.geometry && visible) {
                        let p = feature.properties;
                        let fill_color = p.fill_color || layer.fill_color;
                        let tooltip = p.nimi || p.name || p.kohdetyyppi;
                        let popup = layer.popup ? this.make_popup(feature) : null;
                        for (let coords of feature.geometry.coordinates) {
                            layers.push(
                                <Polygon key={uuidv4()}
                                         fillColor={fill_color}
                                         fillOpacity={layer.fill_opacity}
                                         color={layer.stroke_color}
                                         weight={layer.stroke_width}
                                         opacity={layer.fill_opacity}
                                         positions={coords}>
                                  <Tooltip>{tooltip}</Tooltip>
                                  {popup}
                                </Polygon>
                            );
                        }
                    }
                }
            }
        }

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
        features: state.init.features,
        selected_feature: state.init.selected_feature,
        backgrounds: state.init.backgrounds,
        focused: state.init.focused,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(MyMap);
