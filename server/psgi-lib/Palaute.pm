package Palaute;
use parent qw/Plack::Component/;

use Modern::Perl '2018';
use utf8;
use Encode qw(decode encode);
use Plack::Request;
use DBI;
use JSON;

use Email::MIME;
use Email::Sender::Simple qw(sendmail);

binmode STDOUT, ":utf8";
binmode STDERR, ":utf8";

sub new {
    my ($class, $parameters) = @_;
    my $self = Plack::Component->new($parameters);
    return bless $self, $class;
}

sub call {
    my ($self, $env) = @_;

    my $request = Plack::Request->new($env);
    if ($request->method eq 'OPTIONS') {
        return json200();
    }
    my $content;
    eval {
        $content = JSON->new->utf8->decode($request->content);
    };
    if ($@) {
        return error(400, 'bad content');
    }
    for my $key (keys %$content) {
        $content->{$key} =~ s/\n/<br>/g;
        $content->{$key} =~ s/["'|]//g;
    }

    my $sql = << "END_SQL";
INSERT INTO palaute (aika,nimi,sposti,aihe,palaute)
VALUES (now(),'$content->{name}','$content->{email}',
'$content->{topic}','$content->{feedback}');
END_SQL

    my ($connect, $user, $pass) = split /\s+/, $self->{config}{dbi};
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');
    eval {
        $dbh->do($sql);
    };
    if ($@) {
        return error();
    }

    my $aihe = "Palaute Vesijärvi-karttasovelluksesta:". $content->{topic};
    my $palaute = "<html><b>Palaute:</b> " . $content->{feedback} . "<br><br>";
    $palaute .= "<b>Lähettäjä:</b> " . $content->{name} . '<br><br><b>Sähköpostiosoite:</b> ' . $content->{email} . "</html>";

    eval {
        system "echo '$palaute' | python3 oauth-biwatech.py '$aihe'";
        #my $message = Email::MIME->create(
        #    header_str => [
        #        From    => 'Ari Jolma <ari.jolma@biwatech.com>',
        #        #To      => 'Irma Peltola <Irma.Peltola@vesijarvi.fi>',
        #        To      => 'Ari Jolma <ari.jolma@gmail.com>',
        #        Subject => $aihe,
        #    ],
        #    attributes => {
        #        encoding => 'quoted-printable',
        #        charset  => 'UTF-8',
        #    },
        #    body_str => $palaute,
        #    );
        #sendmail($message);
    };
    if ($@) {
        print STDERR $@;
        return error();
    }
    return json200();
}

sub error {
    my $code = shift // 500;
    my $msg = shift // '';
    $msg = ', ' . $msg if $msg;
    return [
        $code,
        ['Content-Type' => 'text/plain'],
        ["error $code$msg"]];
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
