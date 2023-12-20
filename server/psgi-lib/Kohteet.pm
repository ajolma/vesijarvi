package Kohteet;
use parent qw/Plack::Component/;

use Modern::Perl '2018';
use utf8;
use Plack::Request;
use DBI;
use JSON;
use Data::Dumper;

binmode STDERR, ":utf8";

sub new {
    my ($class, $parameters) = @_;
    my $self = Plack::Component->new($parameters);
    return bless $self, $class;
}

my %schema = (
    'jarvet.ekoltila' => 'ekoltilat.ekoltila',
    'ekoltilat.color' => 'colors.id'
    );

my %style_options = (
    opacity => {numeric => 1},
    fill_color => {numeric => 0, from => 'fill_color.name'},
    fill_opacity => {numeric => 1},
    stroke_color => {numeric => 0, from => 'stroke_color.name'},
    stroke_opacity => {numeric => 1},
    stroke_width => {numeric => 1},
    stroke_linecap => {numeric => 0, from => 'caps.name'},
    font_size => {numeric => 1},
    font_color => {numeric => 0, from => 'font_color.name'},
    graphic_width => {numeric => 1},
    graphic_height => {numeric => 1}
    );

sub call {
    my ($self, $env) = @_;

    my $request = Plack::Request->new($env);
    my $method = $request->method;
    if ($method eq 'OPTIONS') {
        return json200();
    }
    if ($method ne 'GET') {
        return error(404);
    }
    my ($connect, $user, $pass) = split /\s+/, $self->{config}{dbi};
    my $dbh = DBI->connect($connect, $user, $pass) or return error();
    my $path = $request->path_info;
    my $klass;
    if ($path =~ s/\/(\w+)//) {
        $klass = $1;
    }
    return $self->leafs($dbh) unless defined $klass;
    my $layer = 0;
    if ($path ne '') {
        if ($path =~ s/^\/(\d+)//) {
            $layer = $1;
            $layer += 0;
        }
    }
    return $self->estate_geom($dbh, $layer) if $klass eq 'estates' && $layer;
    return $self->bathymetries($dbh, $layer) if $klass eq 'bathymetries' && $layer;
    return $self->layers($dbh, $path, $klass, $layer);
    return error(501);
}

sub leafs {
    my ($self, $dbh) = @_;
    my $sql = "select * from leafs order by nr";
    my $sth = $dbh->prepare($sql) or error(500, $dbh->errstr);
    my $rv = $sth->execute or error(500, $dbh->errstr);
    my @leafs;
    while (my $row = $sth->fetchrow_hashref) {
        my $leaf = $row->{id};
        delete $row->{id};
        $row->{order} = $row->{nr};
        delete $row->{nr};
        if ($row->{layers}) {
            $row->{layers} = [];
        } else {
            delete $row->{layers};
        }
        push @leafs, $row;
    }
    return json200(\@leafs);
}

sub estate_geom {
    my ($self, $dbh, $id) = @_;
    my $geom = geometry('geom');
    my $sql = "SELECT id, $geom FROM osakaskunnat where id=$id and geom is not NULL";
    my $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
    my $rv = $sth->execute or return error(500, $dbh->errstr);
    my $r = $sth->fetchrow_hashref;
    if ($r->{geom}) {
        my $g = decode_json $r->{geom};
        $g = $g->{coordinates};
        swap_xy($g);        
        my $response = {
            type => 'Feature',
            geometry => {
                type => 'MultiPolygon',
                coordinates => $g,
            },
            properties => {
                id => 0 + $id,
            }
        };
        return json200($response);
    } else {
        return json200({
            id => $id,
        });
    }
}

sub bathymetries {
    my ($self, $dbh, $id) = @_;
    my $sql = "SELECT syvyyskartta FROM jarvet where id=$id";
    my $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
    my $rv = $sth->execute or return error(500, $dbh->errstr);
    my $r = $sth->fetchrow_hashref;
    return json200({}) unless $r->{syvyyskartta};
    my $geom = geometry('geom');
    $sql = "SELECT $geom FROM syvyyskartat.\"$r->{syvyyskartta}\"";
    $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
    $rv = $sth->execute or return error(500, $dbh->errstr);
    my $coll = [];
    while (my $r = $sth->fetchrow_hashref) {
        my $g = decode_json $r->{geom};
        $g = $g->{coordinates};
        swap_xy($g);
        push @$coll, $g;
    }
    my $response = {
        type => 'Feature',
        geometry => {
            type => 'MultiPolygon',
            coordinates => $coll,
        },
        properties => {
            id => 0 + $id,
        }
    };
    return json200($response);
}

sub layers {
    my ($self, $dbh, $path, $klass, $layer) = @_;
    my $sql = "select id from leafs where klass='$klass'";
    my $sth = $dbh->prepare($sql) or error(500, $dbh->errstr);
    my $rv = $sth->execute or error(500, $dbh->errstr);
    my $row = $sth->fetchrow_hashref;
    my $leaf = $row->{id};
    return error(404) unless $leaf;
    my %vastuutahot;
    my %seuranta2vastuu;
    if ($klass eq 'monitoring') {
        my $sth = $dbh->prepare("select id,nimi from vastuutahot") or return error(500, $dbh->errstr);
        my $rv = $sth->execute or return error(500, $dbh->errstr);
        while (my $row = $sth->fetchrow_hashref) {
            $vastuutahot{$row->{id}} = $row->{nimi};
        }
        $sth = $dbh->prepare("select seuranta,vastuutaho from seuranta2vastuu") 
            or return error(500, $dbh->errstr);
        $rv = $sth->execute or return error(500, $dbh->errstr);
        while (my $row = $sth->fetchrow_hashref) {
            push @{$seuranta2vastuu{$row->{seuranta}}}, $vastuutahot{$row->{vastuutaho}};
        }
    }

    my @fields = keys %style_options;
    for (@fields) {
        $_ = "$style_options{$_}{from} as $_" if $style_options{$_}{from};
    }
    push @fields, "kohdetyypit.id as id";
    push @fields, "taulu as table";
    push @fields, "nimi as name";
    push @fields, "geometry_column as geom";
    push @fields, "geometry_types.type as geometry_type";
    push @fields, (qw/visible leaf taso legend legend_hidden columns taulu_id label/);
    push @fields, (qw/kuvaus kuvaustaso kuvausotsikko popup defer/);
    push @fields, 'ordr as "order"';
    my $fields = join(', ', @fields) . "\n";

    my @from = ('kohdetyypit');
    push @from, "LEFT JOIN geometry_types ON kohdetyypit.geometry_type = geometry_types.id";
    push @from, "LEFT JOIN caps ON kohdetyypit.stroke_linecap = caps.id";
    push @from, "LEFT JOIN colors fill_color ON kohdetyypit.fill_color = fill_color.id";
    push @from, "LEFT JOIN colors stroke_color ON kohdetyypit.stroke_color = stroke_color.id";
    push @from, "LEFT JOIN colors font_color ON kohdetyypit.font_color = font_color.id";
    my $from = join(' ', @from) . "\n";

    my @where = ('public=TRUE');
    push @where, "leaf=$leaf" if defined $leaf;
    push @where, "kohdetyypit.id=$layer" if $layer;
    my $where = join(' AND ', @where) . "\n";
    
    my $order = 'ORDER by taso,nimi DESC';
    $order = 'ORDER by id ASC' if $klass eq 'buttons';
    
    $sql = "SELECT $fields FROM $from WHERE $where $order";
    $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
    $rv = $sth->execute or return error(500, $dbh->errstr);
    my @rows;
    while (my $row = $sth->fetchrow_hashref) {
        $row->{klass} = $klass;
        push @rows, $row;
    }
    my @tyypit;
    for my $row (@rows) {

        #print Dumper($row);

        $row->{defer} = $row->{defer} ? JSON::true : JSON::false;
        $row->{visible} = $row->{visible} ? JSON::true : JSON::false;
        for my $style_option (keys %style_options) {
            $row->{$style_option} += 0 if $style_options{$style_option}{numeric};
        }
        
        if ($row->{table} =~ /^http/ || $row->{table} =~ /^YouTube/i || !$row->{table}) {
            push @tyypit, $row;
            next;
        }

        my $id = $row->{table} . '.' . $row->{taulu_id};

        my @cols = get_cols($row->{table}, $row->{columns});
        push @cols, "$id as id";

        my @from = ($row->{table});

        my @where = ();
        if ($row->{table} eq 'seurantapisteet') {
            push @where, "$row->{table}.taso=$row->{id}";
        } elsif ($row->{table} eq 'kohteet') {
            push @where, "$row->{table}.tyyppi=$row->{id} AND $row->{table}.public";
        } elsif ($row->{table} eq 'ojatarkkailu') {
            push @where, "$row->{table}.kohdetyyppi=$row->{id}";
        } elsif ($row->{table} eq 'jarvet') {
            push @from, "LEFT JOIN ekoltilat ON $row->{table}.ekoltila = ekoltilat.ekoltila";
            push @from, "LEFT JOIN colors ON ekoltilat.color = colors.id";
            push @where, "$row->{table}.public";
        }

        if ($row->{geom} && !$row->{defer}) {
            push @cols, geometry($row->{geom});
        }
        push @where, "$row->{geom} IS NOT NULL";
        
        my $cols = join(', ', @cols) . "\n";
        my $from = join(' ', @from) . "\n";
        my $where = @where ? 'WHERE ' . join(' AND ', @where) . "\n" : '';
        
        my $sql = "SELECT $cols FROM $from $where ORDER BY $row->{order}";
        #say STDERR $sql;
        $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
        $rv = $sth->execute or return error(500, $dbh->errstr);
        my $coll = {
            type => 'FeatureCollection',
            crs => {
                type => 'name',
                properties => {
                    name => 'urn:ogc:def:crs:EPSG::4326'
                }
            },
            features => [],
        };
        my $count = 0;
        while (my $r = $sth->fetchrow_hashref) {
            $r->{kohdetyyppi} = $row->{name};
            $count++;

            if (!$row->{geom} || $row->{defer}) {
                push @{$coll->{features}}, {
                    type => 'Feature',
                    properties => $r
                };
                next;
            }

            my $g = decode_json $r->{geom};
            delete $r->{geom};

            if ($row->{geometry_type} eq 'Point') {

                if ($row->{table} eq 'seurantapisteet') {
                    my $t = $seuranta2vastuu{$r->{id}};
                    if ($t) {
                        if (@$t == 1) {
                            $r->{vastuutaho} = $t->[0];
                        } else {
                            $r->{vastuutahot} = join(' ja ', @$t);
                        }
                    }
                }
                if ($row->{table} eq 'kohteet') {
                    $r->{vastuutaho} = $vastuutahot{$r->{vastuutaho}};
                }

                my $id = "$row->{id}.$r->{id}";
                $r->{id} = 0 + $r->{id};
                swap_xy($g->{coordinates});
                my $f = {
                    type => 'Feature',
                    id => $id,
                    geometry => $g,
                    geometry_name => 'geom',
                    properties => $r
                };
                push @{$coll->{features}}, $f;

            } else {

                $g = $g->{coordinates};
                swap_xy($g);
                #push @{$coll->{coordinates}}, $g;
                #push @{$coll->{properties}}, $r;

                my $f = {
                    type => 'Feature',
                    id => $id,
                    geometry => {
                        type => $row->{geometry_type},
                        coordinates => $g,
                    },
                    geometry_name => 'geom',
                    properties => $r
                };
                push @{$coll->{features}}, $f;

            }

        }
        $coll->{totalFeatures} = $count;
        $row->{features} = $coll;
        push @tyypit, $row if $count > 0;
    }

    return json200(\@tyypit);
}

sub geometry {
    my $col = shift;
    return "ST_AsGeoJSON(ST_Transform($col, 4326)) as geom";
}

sub get_cols {
    my ($table, $columns) = @_;
    my $from = $table;
    my @cols = split /,/, $columns;
    my @where = ();
    for my $col (@cols) {
        my $t = $table;
        if ($col =~ /as/) {
            my @as = split /\s+as\s+/, $col;
            if ($as[0] =~ /\./) {
                my @list = split /\./, $as[0];
                $col = pop @list;
                for my $f (@list) {
                    my $s = $schema{"$t.$f"};
                    my ($t2, $f2);
                    if ($s) {
                        ($t2, $f2) = split /\./, $s;
                        push @where, "$t.$f = $t2.$f2";
                        $from .= ",$t2";
                    } else {
                        return error(500, "$t.$f not in schema");
                    }
                    $t = $t2;
                }
                $col = "$col as $as[1]";
            }
        }
        $col = $t . '.' . $col;
    }
    return @cols;
}

sub error {
    my $code = shift // 500;
    my $msg = shift // $code;
    return [
        $code,
        ['Content-Type' => 'text/plain'],
        ["error: $msg"]];
}

sub json200 {
    my $data = shift // {};
    my $json = JSON->new;
    $json->utf8;
    return [
        200,
        ['Content-Type' => 'application/json'],
        [$json->encode($data)]];
}

sub swap_xy {
    my $a = shift;
    if (ref $a->[0]) {
        for my $b (@$a) {
            swap_xy($b);
        }
    } else {
        my $tmp = $a->[0];
        $a->[0] = $a->[1];
        $a->[1] = $tmp;
    }
}

1;
