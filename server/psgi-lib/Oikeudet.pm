package Oikeudet;
use parent qw/Plack::Component/;
use Modern::Perl '2018';
use utf8;
use Encode qw(decode encode);
use Plack::Request;
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

    my $sql = "select aineisto,metatieto,lisenssi,omistaja,omistaja_url,latauspvm,lisatieto from oikeudet";
    my $sth = $dbh->prepare($sql) or return error(500, $dbh->errstr);
    my $rv = $sth->execute or return error(500, $dbh->errstr);
    my %oikeudet;
    while (my $row = $sth->fetchrow_hashref) {

        $oikeudet{$row->{aineisto}} = {
            metatieto => $row->{metatieto},
            lisenssi => $row->{lisenssi},
            omistaja => $row->{omistaja},
            omistaja_url => $row->{omistaja_url},
            latauspvm => $row->{latauspvm},
            lisatieto => $row->{lisatieto}
        };
    }
    
    return json200(\%oikeudet);
}

sub error {
    my $code = shift // 500;
    my $msg = shift // $code;
    return [
        $code,
        ['Content-Type' => 'text/plain'],
        "error: $msg"];
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
