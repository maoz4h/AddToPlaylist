import React, { Component } from 'react';

export class Spotify extends Component {
    displayName = Spotify.name

    constructor(props) {
        super(props);
        let authorizationCode = this.getAuthorizationCode();

        this.state = {
            authorized: authorizationCode && authorizationCode !== "",
            loggedIn: false,
            header: 'Logged Out'
        }

        if (this.state.authorized) {
            this.state.authorizationCode = authorizationCode;
            this.setStorage('authorizationCode', '');
            this.state.header = 'Loading';
            //this.state.loggedIn = true;
        }

        if (this.state.authorized && !this.state.clientId) {
            this.state.clientId = this.getStorage('clientId');
            this.setStorage('clientId', '');
        }

        if (this.state.authorized && !this.state.token) {
            this.getAccessToken();
        }
        else if (this.state.authorized && this.state.token) {

        }
    }

    getAuthorizationCode() {
        let authorizationCode = this.getStorage('authorizationCode');
        return (authorizationCode !== "" ? authorizationCode : undefined) || this.getQuery("code");
    }

    getStorage(property) {
        let storageProperty = localStorage.getItem(property);
        return (storageProperty === "undefined" || storageProperty === "") ? undefined : storageProperty;
    }

    setStorage(propertyString, propertyValue) {
        localStorage.setItem(propertyString, propertyValue);
    }

    getCurrentUserId() {
        let me = this;
        var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status === 200) {
                let user = JSON.parse(request.response);
                let userId = user.id;
                me.setState(() => ({
                    userId: userId
                }));
                me.getUserPlaylists();
            }
            else {
                console.warn('error');
            }
        };

        request.open('GET', 'https://api.spotify.com/v1/me');
        request.setRequestHeader('Authorization', "Bearer " + me.state.token);
        request.send();
    }

    getUserPlaylists() {
        let me = this;
        var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status === 200) {
                let user = JSON.parse(request.response);
                let userId = user.id;
                me.setState(() => ({
                    userId: userId
                }));
                request = new XMLHttpRequest();
                request.onreadystatechange = (e) => {
                    if (request.readyState !== 4) {
                        return;
                    }

                    if (request.status === 200) {
                        let playlistsArr = JSON.parse(request.response);
                        me.setState(() => ({
                            userPlaylists: playlistsArr.items.map((i) => ({ name: i.name, id: i.id }))
                        }));
                        this.state.loggedIn = true;
                    } else {
                        console.warn('error');
                    }
                };

                request.open('GET', 'https://api.spotify.com/v1/me/playlists?limit=50');
                request.setRequestHeader('Authorization', "Bearer " + me.state.token);
                request.send();
            } else {
                console.warn('error');
            }
        };

        request.open('GET', 'https://api.spotify.com/v1/me');
        request.setRequestHeader('Authorization', "Bearer " + me.state.token);
        request.send();
    }

    handleLogin(e) {
        e.preventDefault();
        let me = this;
        var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status === 200) {
                let response = JSON.parse(request.response);
                response = JSON.parse(response);
                me.setState(() => ({
                    clientId: response.client_id
                }));
                me.setStorage('clientId', me.state.clientId);
                let url = 'https://accounts.spotify.com/authorize';
                url += '?response_type=code';
                url += '&client_id=' + encodeURIComponent(me.state.clientId);
                url += '&scope=' + encodeURIComponent("user-read-private user-modify-private playlist-modify-private");
                //url += '&show_dialog=true';
                url += '&redirect_uri=' + "https://localhost:44324/spotify";
                window.location = url;
            } else {
                console.warn('error');
            }
        };

        request.open('GET', 'api/Spotify/Login');
        request.setRequestHeader('Accept', 'application/json');
        request.setRequestHeader('Content-Type', 'application/json');
        request.send();
    }

    getQuery(q) {
        return (window.location.search.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, undefined])[1];
    }

    getAccessToken() {
        let me = this;
        var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status === 200) {
                let response = JSON.parse(request.response);
                let date = new Date();
                me.setState(() => ({
                    token: response.access_token,
                    header: 'Logged In',
                    expiresIn: date.setSeconds(date.getSeconds() + response.expires_in - 1),
                    tokenType: response.token_type,
                    scope: response.scope,
                    refreshToken: response.refresh_token,
                }));
                me.getCurrentUserId();
            } else {
                console.warn('error');
            }
        };

        request.open('GET', 'api/Spotify/GetToken?' + 'auth=' + this.state.authorizationCode);
        request.send();
    }

    readSingleFile(file) {
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                this.state.content = e.target.result;
                this.handleAddToPlaylist();
            }.bind(this);
            reader.readAsText(file);
        } else {
            alert("Failed to load file");
        }
        document.getElementById('fileinput').addEventListener('change', this.readSingleFile, false);
    }


    isPlaylistExist() {
        if (this.state.userPlaylists.findIndex((playlist) => playlist.name === this.state.playlistName) > 0)
        {
            var playlist = this.state.userPlaylists.find((playlist) => playlist.name === this.state.playlistName);
            debugger;
            this.setState(() => ({
                playlistId: playlist.id
            }));
        }
    }

    handleAddToPlaylist(e) {
        if (!this.state.playlistName) this.state.playlistName = e.target.elements.playlistName.value.trim();
        if (!this.state.delimiter) this.state.delimiter = e.target.elements.delimiter.value.trim();
        
        if (this.state.content) {
            const content = this.state.content;
            this.setState(() => ({
                content: undefined
            }));
            const titleArtistsPairs = this.getPairsFromContent(content, this.state.delimiter);
            if (this.isPlaylistExist(this.state.playlistName)) {
                this.addSongsToPlaylist(titleArtistsPairs);
            }
            else {
                this.createPlaylistAndAddSongsToIt(titleArtistsPairs);
            }
        }
        else {
            e.preventDefault();
            const file = e.target.elements.fileinput.files[0];
            this.readSingleFile(file);
        }
    }

    getTitleArtistSpotifyId(titleArtistsPairs, index, titleArtistSpotifyIds, failedPairs) {
        var me = this;

        if (index === titleArtistsPairs.length) {
            var request = new XMLHttpRequest();

            request.onreadystatechange = (e) => {
                if (request.readyState !== 4) {
                    return;
                }

                if (request.status === 200 || request.status === 201) {
                    alert('Success!');
                    if (failedPairs.length > 0) {
                        alert('Failed to add: ' + failedPairs.map((p) => p[0] + ' ' + p[1]));
                    }
                }
                else {
                }
            };

            request.open('POST', 'https://api.spotify.com/v1/playlists/' + me.state.playlistId + '/tracks');
            request.setRequestHeader('Authorization', "Bearer " + me.state.token);
            request.setRequestHeader('Content-Type', 'application/json');
            var data = JSON.stringify({
                "uris": titleArtistSpotifyIds.map((tai) => 'spotify:track:' + tai.spotifyId)
            });
            request.send(data);
            return;
        }
        let pair = titleArtistsPairs[index];
        var request = new XMLHttpRequest();

        request.onreadystatechange = (e) => {
            var that = me;
            var pair2 = pair;
            var i = index;
            var res = titleArtistSpotifyIds;
            var failed = failedPairs;
            var arr = titleArtistsPairs;
            if (request.readyState !== 4) {
                return;
            }
            
            if (request.status === 200 && JSON.parse(request.response).tracks.total > 0) {
                let track = JSON.parse(request.response).tracks.items[0];
                let title = track.name;
                let artist = track.artists[0].name;
                let spotifyId = track.id;
                //me.state.titleArtistId.push({ title: title, artist: artist, spotifyId: spotifyId });
                res.push({ title: title, artist: artist, spotifyId: spotifyId });
                
            } else {
                failed.push(pair2);
            }
            this.setState(() => ({
                header: 'Scanning: ' + (i + 1) + ' out of: ' + arr.length,
                succeedHeader: 'Found: ' + res.length,
                failedHeader: 'Failed: ' + failed.length
            }));
            that.getTitleArtistSpotifyId(arr, i + 1, res, failed);
        };
        
        let query = 'q=track:' + pair[0].replace(' ', '+AND+') + '+artist:' + pair[1].replace(' ', '+AND+') + '&type=track&limit=1';

        request.open('GET', 'https://api.spotify.com/v1/search?' + query);
        request.setRequestHeader('Authorization', "Bearer " + me.state.token);
        request.send();
    }

    addSongsToPlaylist(titleArtistsPairs) {
        var titleArtistSpotifyIds = [];
        var failedPairs = [];
        this.setState(() => ({
            header: "Loading"
        }));

        this.getTitleArtistSpotifyId(titleArtistsPairs, 0, titleArtistSpotifyIds, failedPairs);
    }

    createPlaylistAndAddSongsToIt(titleArtistsPairs) {
        let me = this;
        var request = new XMLHttpRequest();
        request.onreadystatechange = (e) => {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status === 200 || request.status === 201) {
                var playlistId = JSON.parse(request.response).id;
                me.setState(() => ({
                    playlistId: playlistId
                }));
                me.addSongsToPlaylist(titleArtistsPairs);
            } else {
                console.warn('error');
            }
        };

        request.open('POST', 'https://api.spotify.com/v1/users/' + this.state.userId + '/playlists');
        request.setRequestHeader('Authorization', "Bearer " + me.state.token);
        request.setRequestHeader('Content-Type', 'application/json');
        var data = JSON.stringify({
            "name": this.state.playlistName,
            'public': false,
            'collaborative': false
        });
        request.send(data);
    }

    getPairsFromContent(content, delimiter) {
        let pairs = [];
        let lines = content.split("\n");
        pairs = (lines.map((line) => (
            line.split(delimiter)
        )));
        return pairs;
    }

    render() {
        return (
            <div>
                <p id="header">{this.state.header}</p>
                <p id="succeed">{this.state.succeedHeader}</p>
                <p id="failed">{this.state.failedHeader}</p>
                {!this.state.authorized &&
                    <form onSubmit={this.handleLogin.bind(this)}>
                        <button>Login</button>
                    </form>
                }
                {this.state.token &&
                    <form onSubmit={this.handleAddToPlaylist.bind(this)}>
                        Playlist name<input type="text" name="playlistName" />
                        <br />
                        Delimiter<input type="text" name="delimiter" />
                    <input type="file" id="fileinput" name="fileinput" />
                    <button disabled={this.state.loggedIn}>Add Songs to Playlist</button>
                    </form>
                }
            </div>
        );
    }
}
