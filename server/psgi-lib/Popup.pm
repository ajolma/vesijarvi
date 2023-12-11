package Popup;
use utf8;
use strict;
use warnings;
use 5.010000; # say // and //=
use Carp;
use Encode qw(decode encode);
use Plack::Request;
use Geo::OGC::Service;
use DBI;
use JSON;

use parent qw/Plack::Component/;

my $debug = 0;

binmode STDERR, ":utf8";

sub new {
    my ($class, $parameters) = @_;
    my $self = Plack::Component->new($parameters);
    return bless $self, $class;
}

sub call {
    my ($self, $env) = @_;
    my ($connect, $user, $pass) = split /\s+/, $self->{config}{dbi};
    my $dbh = DBI->connect($connect, $user, $pass) or return error(500);

    my $sql = "select nr,otsikko,sarake from popup order by nr";
    my $sth = $dbh->prepare($sql) or error(500, $dbh->errstr);
    my $rv = $sth->execute or error(500, $dbh->errstr);
    my @leafs;
    while (my $row = $sth->fetchrow_hashref) {
        push @leafs, $row;
    }    
    return json200(\@leafs);
}

sub error {
    my $code = shift // 500;
    my $msg = shift // $code;
    return [
        $code, ['Content-Type' => 'text/plain'], "error: $msg"];
}

sub json200 {
    my $data = shift // {};
    my $json = JSON->new;
    $json->utf8;
    return [200, ['Content-Type' => 'application/json'], [$json->encode($data)]];
}

1;
