using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace ReactDemo.Controllers
{
    [Route("api/[controller]")]
    public class SpotifyController : Controller
    {
        private String clientId = "4836c599ff1f481b972243e3abd00541";
        private String clientSecret = "37ef8d95df4947e7b95f0391fcd5589c";

        [HttpGet("[action]")]
        public string Login([FromBody]LoginInput input)
        {
            Dictionary<string, string> res = new Dictionary<string, string>();
            res.Add("client_id", "4836c599ff1f481b972243e3abd00541");
            res.Add("client_secret", "37ef8d95df4947e7b95f0391fcd5589c");
            return JsonConvert.SerializeObject(res);
        }

        [HttpGet("[action]")]
        public async Task<object> GetToken()
        {
            Dictionary<string, string> res = new Dictionary<string, string>();
            res.Add("token", "4836c599ff1f481b972243e3abd00541");
            String response;
            var query = "?grant_type=authorization_code" +
            "&code=" + Request.QueryString.Value.Split('=')[1] +
            "&redirect_uri=https://localhost:44324/spotify";


            StringContent stringContent = new StringContent("", UnicodeEncoding.UTF8, "application/x-www-form-urlencoded");
            //stringContent.Headers.Add("Content-Type", "application/x-www-form-urlencoded");

            using (var client = new HttpClient())
            {

                client.BaseAddress = new Uri("https://accounts.spotify.com/api/token");
                //client.DefaultRequestHeaders.Add("Content-Type", "application/x-www-form-urlencoded");
                //client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/x-www-form-urlencoded"));// = "application/x-www-form-urlencoded";//.Add("Content-Type", "application/x-www-form-urlencoded");
                //client.DefaultRequestHeaders.AddWithoutValidation("Content-Type", "application/x-www-form-urlencoded");
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + encoding(clientId + ':' + clientSecret));
                var result = await client.PostAsync(query, stringContent);
                response = await result.Content.ReadAsStringAsync();
            }
            return JsonConvert.DeserializeObject(response);
            //return response;
        }

        public void AddContentTypeHeader(HttpRequestMessage message, string value)
        {
            message.Content = new StringContent("");
            message.Content.Headers.ContentType = new MediaTypeHeaderValue(value);
        }

        /*
        request.open('POST', 'https://accounts.spotify.com/api/token');
        request.setRequestHeader('Authorization', 'Basic ' + btoa(me.state.clientId + ':' + me.state.clientSecret));
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        var query = 'grant_type=authorization_code' +
            '&code=' + me.state.authorizationCode +
            '&redirect_uri=https://localhost:44313/spotify';
        request.send(query);
        */
        public class LoginInput
        {
            public string UserName { get; set; }
            public string Password { get; set; }
        }

        public string encoding(string toEncode)
        {
            byte[] bytes = Encoding.GetEncoding(28591).GetBytes(toEncode);
            string toReturn = System.Convert.ToBase64String(bytes);
            return toReturn;
        }
    }
}

/*
string page = "https://accounts.spotify.com/authorize";
var parameters = new Dictionary<string, string>();
parameters.Add("client_id", "4836c599ff1f481b972243e3abd00541");
parameters.Add("response_type", "code");
parameters.Add("redirect_uri", "");
var query = HttpUtility.ParseQueryString(string.Empty);
query["client_id"] = "4836c599ff1f481b972243e3abd00541";
query["response_type"] = "code";
query["redirect_uri"] = "https://localhost:44313/spotify";
query["scope"] = "user-read-private user-modify-private playlist-modify-private";
string queryString = query.ToString();
string responseBody = String.Empty;
// ... Use HttpClient.
using (HttpClient client = new HttpClient())
{
    // Call asynchronous network methods in a try/catch block to handle exceptions
    try
    {
        HttpResponseMessage response = await client.GetAsync("https://accounts.spotify.com/authorize?" + queryString);
        response.EnsureSuccessStatusCode();
        responseBody = await response.Content.ReadAsStringAsync();
        // Above three lines can be replaced with new helper method below
        // string responseBody = await client.GetStringAsync(uri);

        Console.WriteLine(responseBody);
    }
    catch (HttpRequestException e)
    {
        Console.WriteLine("\nException Caught!");
        Console.WriteLine("Message :{0} ", e.Message);
    }
}*/

//string url = "https://accounts.spotify.com/authorize";
//var parameters = new Dictionary<string, string>();
//parameters.Add("client_id", "4836c599ff1f481b972243e3abd00541");
//parameters.Add("response_type", "code");
//parameters.Add("redirect_uri", "");

//var encodedContent = new FormUrlEncodedContent(parameters);
//HttpClient client = new HttpClient();
//var response = await client.GetAsync(url, encodedContent).ConfigureAwait(false);
//if (response.StatusCode == HttpStatusCode.OK)
//{
//    // Do something with response. Example get content:
//    // var responseContent = await response.Content.ReadAsStringAsync ().ConfigureAwait (false);
//}
