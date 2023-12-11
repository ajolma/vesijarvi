package Taustakartat;
use parent qw/Plack::Component/;

use Modern::Perl '2018';
use utf8;
use DBI;
use JSON;

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

    my $sql = << "END_SQL";
SELECT url,otsikko,kuvaus,attribution,oletus
FROM taustakartat
ORDER BY id
END_SQL

    my $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
    my $rv = $sth->execute or return error(500, $dbh->errstr);
    my @rows;
    while (my $row = $sth->fetchrow_hashref) {
        push @rows, $row;
    }

    return json200(\@rows);
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

1;
