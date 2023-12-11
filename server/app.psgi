use strict;
use warnings;
use Config::Tiny;
use Plack::Builder;
use Plack::App::File;
use Plack::Middleware::Deflater;
use lib './psgi-lib';
use Kohteet;
use Palaute;
use Popup;
use Oikeudet;
use Rahoittajat;
use Taustakartat;

my $config = Config::Tiny->read('app.conf')->{root};

sub cors {
    my $app = shift;
    sub {
        my $env = shift;
        my $res = $app->($env);
        push @{ $res->[1] }, (
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => '*',
            );
        return $res;
    };
}

my $root = $config->{root};
builder {
    enable 'ReverseProxy';
    enable "Deflater", content_type => ['application/json'], vary_user_agent => 1;
    enable \&cors;
    mount $root . "/oikeudet" => Oikeudet->new({config => $config})->to_app;
    mount $root . "/popup" => Popup->new({config => $config})->to_app;
    mount $root . "/palaute" => Palaute->new({config => $config})->to_app;
    mount $root . "/kohteet" => Kohteet->new({config => $config})->to_app;
    mount $root . "/media" => Plack::App::File->new(root => "./media")->to_app;
    mount $root . "/rahoittajat" => Rahoittajat->new({config => $config})->to_app;
    mount $root . "/taustakartat" => Taustakartat->new({config => $config})->to_app;
    mount "/" => sub {
        my $env = shift;
        return [200,
        ['Content-Type' => 'text/html'],
        ['<a href="' . $root . '/kohteet">Sites</a><br />']];
    };
}
