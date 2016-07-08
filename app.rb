require 'sinatra'
require 'json'
require "net/http"
require "uri"

# GOTCHAS - READ THIS!!!!!
# 1. Note that if you are making changes to this file, you will need to restart the Sinatra server for them to take effect.
# 2. Remember that Ruby has implicit returns. The last line in a function will attempt to be returned to the front end unless you specify a 'return' earlier.

get '/' do
  # Simply reads the HTML from the file and sends it to the browser.
  File.read('views/index.html')
end

post '/favorites' do
  # Expects JSON data.
  content_type :json

  # We don't want duplicates because we want to serve the data simply and directly, so we need to give Sinatra a way to check the whole file before saving.
  def check_file_for_duplicates(file, string)
    File.foreach(file).detect { |line| line.include?(string) }
  end

  # This shouldn't happen because of the 'a+' option (append, but if file does not exist, create and append) passed in to File.open, but just in case we set a default for our front end
  # to respond to in case of something catastrophic.
  status = {:status => "parseFailed"}

  # Open the file, append the data needed, close the file. It is important to save the data exactly like it is retireved from the OMDB API so you can transform it easily on the front end
  # or manipulate it cleanly here on the server. 
  File.open('data.json', "a+") do |file|

    # EXTRA: This API call isn't well-handled! Write some code to make sure that we aren't giving OMDB an invalid 'i' parameter.
    # Catch the error and report it to the front-end if that does happen, though!
    uri = URI.parse("https://www.omdbapi.com/?i=#{params[:id]}&plot=short&r=json")
    data = Net::HTTP.get_response(uri).body

    if check_file_for_duplicates(file, data)
      puts 'duplicate'
      status = {:status => "duplicate"}
    else
      file.puts data
      status = {:status => "success"}
    end

  end

  # Send a response
  # Head back to main.js if you are following along numerically.
  return status.to_json
end

get '/favorites' do
  # Expects JSON data
  content_type :json

  favorites = []

  # This is another way to handle files in Ruby. Just remember to f.close the file after you are done with it!
  # The 'r' option stands for 'read' and just means that we are only reading from the file and not trying to amend it in any way. 
  f = File.open("data.json", "r")

  # Grab each line, parse it to JSON, then push it to the array to get served to the front end.
  # It is worth noting that you should really push objects that you plan to iterate over on the front-end in to arrays. You should hash it if you have mutiple arrays.

  # There is a bit of confusing magic going on here even if this seems strightforward. What is happening here is we are parsing a single line of JSON from data.json in to a Ruby object then pushing it to
  # the 'favorites' array. Why not just push the string itself? It's just JSON data, right? Well, it is. The problem lies in the fact that we have to also parse the final array (favorites) in to JSON.
  # If you push a raw JSON string in to the array and parse that, the to_json method thinks that it's just a huge string and doesn't actually parse it correctly. It knows how to parse Ruby objects, but doesn't
  # intrinsically know to parse a JSON formatted string inside of that array in to JSON.

  # Basically, it's so stupid that it doesn't recognize it's own kind. That's a very computer-ish thing to do. 

  f.each_line do |line|
    p rubified_json = JSON.parse(line)
    favorites.push(rubified_json)
  end
  f.close

  # Be sure to turn the final array in to JSON as well as the whole thing needs to be parsed by the front end! It'll confuse the parser if you don't.
  return favorites.to_json
  # Head back over to main.js if you're following along numerically. 
end


# **Issues**: Didn't start the 'do' block. Didn't set the path correctly with File.join or set it strictly like I did.
# ---------------
# get '/'
#   File.read('index.html')
# end

# **Issues**: It's easier to set the content_type :json in the function than the set response headers every time. I would include that and an explanation in the initial
# files (readme or the skeleton presented to students) for clarification.

# Also, simply reading the file with the JSON in it won't work. I explain why above and give a simple solution, but the parsers on the front-end
# wont know how to handle a non-comma-separated-contained-in-json-array-or-hash/object type of response for multiple JSON objects.

# Unless they want to write a more complex insertion/write method to handle formatting, it is better to read each line and push that to an array then parse it and send it back.
# ---------------
# get 'favorites' do
#   response.header['Content-Type'] = 'application/json'
#   File.read('data.json')
# end

# **Issues**: I see what they are trying to do, but they are missing a lot of pieces. This looks a lot more like pseudocode.

# It's good that they are checking for params, but is there really a need for both an id and name param? If they are planning on saving both for whatever reason, this is appropriate.
# I like the idea of making an API call on the server to increase clarity and keep the data more visible in this situation since we aren't using a database where you can view the models.

# They are also using pretty_generate when they write to the file which when it returns malforms the JSON. I'm pretty sure it adds newline characters.
# That'll mess your data consistency up real quick.

# It's better to save the exact reponse you get back and parse it later. You can just p JSON.pretty_generate(object) if you want to see it in your terminal.
# It seems more appropriate to save the exact string as it came back came back fron the API as you just treat the object pulled from the file as an API reponse. For smaller-scale applications, at least. 
# (Dunno why you'd build something scalable/maintinable without a database though.)

# In my implementation, I decided to make the API call on the server primarily becase it's much clearer what exactly is going in to the database/data file this way. You can save full objects and serve
# them without having to do promises (which suck without libraries and would be really confusing for a beginner) or write loops to grab all of that data due to how the OMDB ?i=id param works.
# ---------------
# get '/favorites' do
#   file = JSON.parse(File.read('data.json'))
#   unless params[:name] && params[:oid]
#     return 'Invalid Request'
#   movie = { name: params[:name], oid: params[:oid] }
#   file << movie
#   File.write('data.json',JSON.pretty_generate(file))
#   movie.to_json
# end
