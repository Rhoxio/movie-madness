// GOTCHAS -- READ THIS!
// Sometimes the OMDB API iss really really slow. When you are building and debugging, I highly suggest using simple terms like "Movie" or "Lord" as these return very consistent results.

// Once the document is loaded...

document.addEventListener('DOMContentLoaded', function() {

  // We know that these elements are loaded on the page since we are in this function (as long as they are defined in the HTML that is)
  // so we can go ahead and assign them to variables to start working on them.
  var searchButton = document.getElementById("searchButton");
  var getFavoritesButton = document.getElementById("getFavorites");
  var searchInput = document.getElementById("searchInput");
  var movieContainer = document.getElementById("movieContainer");


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                            DELEGATE SOME EVENTS                                                                                //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // (The functions called in here haven't been gone over yet, so just take them at face-value for the moment. They do just what their names imply!)
  // To bind events, you can use a few different techniques. Here are two examples:
  searchButton.onclick = function(e){
    // Take the input value
    var searchTerm = searchInput.value

    // Make a new request...
    var request = new XMLHttpRequest();

    // Let's talk about this 'load' event for a moment. Basically, inside of an XMLHttpRequest object there is a state that gets switched over when the
    // response comes back. When this happens, a 'load' event is fired and the request object's reponseText variable gets set. By binding a function to that event, we can handle the response
    // as soon as it comes in. Pretty nifty!
    request.addEventListener("load", function(){
      response = JSON.parse(this.responseText)

      if(response.Error){
        var error = response.Error
        // We can catch if they just didn't enter a search term quite easily, so we just handle it.
        if(searchTerm === ''){ error = "Enter a search term."}
        console.log({error: error})
        renderError(error)
      } else {
        renderMovies(response.Search)
      }
    });
    // This is what a pretty standard API call looks like. The '?' in the URI is what separates the 'path' from the 'query'.
    request.open("GET", "https://www.omdbapi.com/?s="+searchTerm+"&plot=short&r=json");
    // For more info in URI structure, visit: http://uri.thephpleague.com/components/overview/

    // Each query parameter is separated by an '&' sign. It kind of works like a comma in an array. Query structure is much like a Javascript object, 
    // since '?animal=dog&variable=value' in the query is functionally similar to {"animal":"dog", "key":"value"} in Javascript. 
    request.send();
  }

  // Just like above, you could pass an anonymous function in here instead of a pre-defined function. Remember that you will have the 'event'
  // variable available in the callback. It is refered to as 'e' in this project as you'll see below.
  getFavoritesButton.addEventListener('click', getFavorites)

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                              SHOW THOSE ERRORS                                                                                 //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Giving your users some kind of feedback about what is happening is a very important part of building good software. The renderError function is a simple solution to help
  // make it easier for you to give them the feedback that they need to more confidently navigate the UI you have built.

  function renderError(error){
    // Find the error container...
    var errorContainer = document.getElementById('errorContainer');

    // Clean it out.
    while (errorContainer.firstChild) {
        errorContainer.removeChild(errorContainer.firstChild);
    }    

    // Slap some red text with the error message in the error container. Simple!
    errorContainer.insertAdjacentHTML( 'beforeend', "<p style='color: red;'>"+error+"</p>" );
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                          WRITING CORE FUNCTIONALITY                                                                            //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // We have some functionality to define now. We know that we are going to need to render HTML to elements, make API calls to our server as well as
  // the OMDB API, and we are going to need to handle errors elegantly and give users some sort of feedback. With those goals in mind, let's get coding!

  // 1. Since most of the functionality requires us to use API calls somewhat independently and we have already bound the searchButton's onclick event to make an API call to OMDB, we need to
  // figure out a way to get that info on to the page. That's where the renderMovies function comes in.

  function renderMovies(list){
    // We would like this to be able to render the movies from favorites as well, so we need to have it take an argument that contains an array of movies.

    var movies = list

    // Clean up the old movie container. This code basically looks to see if the container has a child element and if so, it removes it until there are none left.
    while (movieContainer.firstChild) {
        movieContainer.removeChild(movieContainer.firstChild);
    }

    // We need to loop over all of the movies passed in to this function. They should already be JSON, so this should be a simple matter.
    for(i = 0; i < movies.length; i++){
      // generateMovieEntry() basically takes in a single movie object and creates a set of HTML to be appended to the movieContainer. 
      var movieHTML = generateMovieEntry(movies[i])

      // If you want more info on the insertAdjacentHtml function and how it works, check out: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
      movieContainer.insertAdjacentHTML( 'beforeend', movieHTML );

      // Now, we have to bind events to the buttons generated or else they won't work! We use the imdbID because it is guaranteed to be a unique value for every movie. 
      var favoriteButton = document.getElementById(""+movies[i].imdbID);
      var infoButton = document.getElementById("expand-"+movies[i].imdbID);
      favoriteButton.addEventListener('click', addToFavorites)
      infoButton.addEventListener('click', expandInfo)
    }      
      
  }   

  // 2. Now, how exacly did we construct the HTML earlier? Just like almost everything else on the internet, it's just a fancy string.
  // This is one way to build HTML and tends to be the easiest way to 'template' it out without libraries. You can transform/pass data in then just return a string with concatenated
  // values within it.

  function generateMovieEntry(movie){
    // When having to nest quotes inside of strings, remember to use double quotes around single quotes as it won't break the string.
    // Sometimes it helps to format the strings in a similar fashion to standard HTML with indentation by using a '+' at the end of a line. Make it easy on yourself!

    // Remember, this function just returns a string. That's all HTML really is!
    return "<div class='movieEntry'>"+
            "<h2>"+movie.Title+"</h2>"+
            "<img src=' "+movie.Poster+"'/>"+
            "<div class='buttonContainer'>"+
              "<button id='"+movie.imdbID+"'> Add to Favorites! </button>"+
              "<button class='expandInfo' id='expand-"+movie.imdbID+"'> More Info </button>"+
            "</div>"+

            "<div id='extra-info-"+movie.imdbID+"' class='collapsed moreInfo'>"+
            "</div>"+
           "</div>"
  }

  // 3. So, we can now get movies and render them to the DOM. Now, we need to be able to grab advanced info for a particular movie. That's where expandInfo comes in!

  function expandInfo(e){
    // Here is the 'e' that was talked about earlier! This is called an 'event' object and can give you information about the element whose event was fired to call this function.
    // One of the most popular uses of the 'event' object is what has been done below. There are a ton of other uses for the event object, and this is just one implementation.

    // Need to do some string manipulation to grab the ID from the 'More Info' button. They should always have the same ID as the generateMovieEntry function
    // renders both of the elements we need to amend. This may seem like a bit of hooplah to go through, but it's all just centered around keeping consistent naming conventions in your generateHTML functions.

    // EXTRA: This isn't super clean as we are having to split and append something's id to find the container. Can you figure out a better way to do this?
    // You can change the way the HTML is structured in generateMovieEntry if you'd like.
    var id = e.target.id.split('-')[1]
    var parentElementId = "extra-info-"+id

    var extraInfoContainer = document.getElementById(parentElementId);
    var extraInfoButton = document.getElementById(e.target.id);

    var request = new XMLHttpRequest();
    request.addEventListener("load", function(){
      movie = JSON.parse(this.responseText)

      // Render the movie info to the corrent parent container.
      renderMovieInfo(movie, extraInfoContainer)

      // Unless you want both events firing when you click the button again, you have to remove the current 'click' listener and assign it a new one.
      extraInfoButton.removeEventListener("click", expandInfo);

      // We now bind purgeInfo to the same button and change the innerHTML so users know that they can 'collapse' the info box.
      extraInfoButton.addEventListener('click', purgeInfo);
      extraInfoButton.innerHTML = "Less Info"     
    });
    request.open("GET", "https://www.omdbapi.com/?i="+id+"&plot=short&r=json");
    request.send();
  }  

  // 4. Just like the renderMovies function, this function clears the container and appends generated HTML to the appropriate element.

  function renderMovieInfo(movie, parent){
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }

    // generateMovieInfo is just another function that constructs HTML from a value.
    var movieInfoHTML = generateMovieInfo(movie)
    parent.insertAdjacentHTML( 'beforeend', movieInfoHTML );
  }  

  // 5. Look, another set of HTML! It's just more string concatenation. 

  function generateMovieInfo(movie){
    return "<h5> Actors/Actresses: "+movie.Actors+"</h5>"+
           "<h5> Director: "+movie.Director+"</h5>"+
           "<h5> Genre: "+movie.Genre+"</h5>"+
           "<h5> Rating: "+movie.Rated+"</h5>"+
           "<h5> Genre: "+movie.Genre+"</h5>"+
           "<h5> Plot: "+movie.Plot+"</h5>"
  }

  // 6. The purgeInfo function is more-or-less a simple way for a user to 'collapse' the info section. All it really ends up doing is clearing the container
  // and reassigning the events.

  function purgeInfo(e){

    // EXTRA: This has the same problem as above. The same solution should work here if it worked there!
    var id = e.target.id.split('-')[1]
    var elementId = "extra-info-"+id

    var extraInfoContainer = document.getElementById(elementId);
    var extraInfoButton = document.getElementById(e.target.id);

    // Purge the container element of it's children elements.
    while (extraInfoContainer.firstChild) {
      extraInfoContainer.removeChild(extraInfoContainer.firstChild);
    }

    // Be sure to remove the old listener unless you want it to execute both at once!
    extraInfoButton.removeEventListener("click", purgeInfo);
    extraInfoButton.addEventListener('click', expandInfo)
    // Change button text back to it's default innerHTML state.
    extraInfoButton.innerHTML = "More Info"
  }

  // 7. The next step is to make it so you can actually favorite movies and have it persist. This takes a few steps, the first consisting of making a POST request to our server.
  function addToFavorites(e){

    // After the data for the selected movie is obtained, we have to POST to our server to save it to favorites.
    // This is also a good time to head over to app.rb and check out the post /favorites route. The route ends up taking the ID from the request param
    // and making it's own API call to OMDB before saving the movie to favorites.
    var post = new XMLHttpRequest();
    post.addEventListener("load", function(){
      var postResponse = JSON.parse(this.responseText)
      var button = document.getElementById(e.target.id);

      // Here's an example of what you might do to give them some UI feedback. The server returns a status object telling you wether or not there
      // was a duplicate, so you might as well let them know what happened. Giving them green to show success, orange or yellow for warnings, and red for failures
      // is generally a great way to communicate what happened without explicitly having to give them an error message. 
      if(postResponse.status == 'duplicate'){
        button.innerHTML = "Already Favorited!"
        button.style.color = "black"
        // Orange
        button.style.backgroundColor = "#ff9900"        
        button.removeEventListener("click", addToFavorites);
      } else if (postResponse.status == 'success'){
        button.innerHTML = "Favorited!"
        button.style.color = "black"
        // Green
        button.style.backgroundColor = "#00cc00"
        button.removeEventListener("click", addToFavorites);          
      } else if (postResponse.status == 'parseFailed'){
        // We did not change the button as this is a case where button state has nothing to do with what happened and an actual error occured.
        renderError('Could not save favorite.')
      }

      // We unbind the event because no matter what, they don't have any reason to keep hitting the button after clicking it once. If they click twice in rapid succession before
      // the response comes back, the server may send a 'duplicate' message back but it isn't technically incorrect. Let them know exactly what happened unless it exposes internal functionality!

    })

    // Since most of the time when you end up submitting forms (from an actual form element with a submit button) it will set the headers automatically, we have to set the "Content-type" header to
    // the same as a form so the Sinatra server understands what it is receiving. Otherwise, Sinatra will scream at you about incompatible encodings and UTF-8. You don't want that, right?
    post.open("POST", window.location.href+"favorites?id="+e.target.id)
    post.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    post.send()
  };   

  // 8. Almost done! Now, we need to get all of the favorites from the server and display them in the same container as where the movies normally live.

  function getFavorites(){
    var request = new XMLHttpRequest();

    // This is a surprisingly small amount of code! That's because we already have the renderMovies function set up to handle data formatted in the same fashion as we
    // have saved it and served it from the server. Neat!

    // This, again, is a good time to look at app.rb under the get /favorites route and see what goes on to serve the data correctly.
    request.addEventListener("load", function(){
      response = JSON.parse(this.responseText)
      renderMovies(response)
    });

    request.open("GET", window.location.href+"favorites")
    request.send();
  }

  // 9. Rejoice! You now know how to build a basic single-page application! Keep practicing and honing your skills, and don't be ashamed to model future projects off of this code.
  // Always be sure that you know the basics surrounding how something is working before utilizing it, and don't ever be afraid to ask questions or do a Google search to learn more.
  // If you have questions about this codebase, feel free to email Kevin Maze at rhoxiodbc@gmail.com. (Github: Rhoxio)

}, false);





