import React, { Component } from 'react';

export class Spotify extends Component {
    displayName = Spotify.name

    constructor(props) {
        super(props);
        var authorizationCode = this.getStorage('authorizationCode');
        if (this.state) {
            if (!this.state.authorizationCode) {
                if (!authorizationCode) {
                    authorizationCode = this.getQuery("code");
                }
                this.setState(() => ({
                    authorizationCode: authorizationCode,
                }));
                this.setStorage('authorizationCode', this.state.authorizationCode);
            }
        }
        else {
            this.state = {
                loggedIn: false,
                header: 'Logged Out'
            }

            authorizationCode = (authorizationCode !== "" ? authorizationCode : undefined) || this.getQuery("code");
            if (authorizationCode && authorizationCode !== "") {
                this.state.authorizationCode = authorizationCode;
                this.setStorage('authorizationCode', '');
                this.state.loggedIn = true;
            }

            if (this.state.authorizationCode && !this.state.clientId) {
                this.state.clientId = this.getStorage('clientId');
                this.setStorage('clientId', '');
                if (this.state.clientId) this.state.header = 'Loading';
            }
        }

        if (this.state.loggedIn && !this.state.token) {
            this.getAccessToken();
        }
        else if (this.state.loggedIn && this.state.token) {

        }
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
            } else {
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
                            userPlaylists: playlistsArr
                        }));
                        //playlistsArr.items.findIndex((i) => i.name === this.state.playlistName) > 0
                    } else {
                        console.warn('error');
                    }
                };

                request.open('GET', 'https://api.spotify.com/v1/users/' + me.state.userId + '/playlists');
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
                    clientId: response.client_id,
                    //clientSecret: response.client_secret
                }));
                me.setStorage('clientId', me.state.clientId);
                //me.setStorage('clientSecret', me.state.clientSecret);
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
                me.getUserPlaylists();
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


    isPlaylistExist(playlistName) {
        this.getUserPlaylists();
        debugger;
    }

    handleAddToPlaylist(e) {
        if (!this.state.playlistName) this.state.playlistName = e.target.elements.playlistName.value.trim();
        if (!this.state.delimiter) this.state.delimiter = e.target.elements.delimiter.value.trim();

        if (this.isPlaylistExist(this.state.playlistName)) {

        }
        else {
            this.createPlaylist(this.state.playlistName);
        }
        if (this.state.content) {
            const content = this.state.content;
            this.setState(() => ({
                content: undefined
            }));
            const titleArtistsPairs = this.getPairsFromContent(content, this.state.delimiter);

        }
        else {
            e.preventDefault();
            const file = e.target.elements.fileinput.files[0];
            this.readSingleFile(file);
        }
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
                {!this.state.loggedIn &&
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
                        <button>Add Songs to Playlist</button>
                    </form>
                }
            </div>
        );
    }
}
