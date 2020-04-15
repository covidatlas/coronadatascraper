# Hack all of the scraper files.
#
# USAGE:
#
# - cd into this directory,
# - run `ruby this-script.rb WRITE [FILENAME]`
#
# WRITE is either true or false.
# - 'save' to overwrite source files
# - 'print' to dump to console
# - 'mute' to not print or save (useful to see the changes that would happen)
#
# FILENAME: name of the file to work with.  If missing,
# do all files.
#
# eg.,
#   ruby <this-script.rb> print DEU/_shared.js

if (ARGV.size < 1) then
  puts "usage: ruby <this_script.rb> WRITE [FILENAME]"
  puts "where WRITE = save/print/mute"
  return
end

WRITE = ARGV[0].to_s.downcase
FILENAME = (ARGV.size > 1) ? ARGV[1] : nil

# Skip some files.
# Not bothering to try to determine these programmatically.
# IGNORE_FILES = %w(
# AUS/_shared/get-data-with-tested-negative-applied.js
# AUS/_shared/get-key.js
# )

METHODS = 'page|fetch|raw|json|jsonAndCookies|csv|tsv|pdf|headless'


# NEED TO DO THIS:
FETCH_RE = /(await\s+.*?\.(?:#{METHODS})\s*\(.*?, )([^,)]*)(.*)/


# Manual tests to verify
# lin = "const $ = await fetch.page(this, healthUrl);
# const $ = await fetch.page(this, healthUrl, some_other_stuff);
# const $ = await fetch.csv(this, 'something.com', some_other_stuff);
# "
# lin.scan(FETCH_RE).each do |m|
#   puts '----'
#   puts m.inspect
#   puts "#{m[0]}#{m[1]}, 'default'#{m[2]}"
# end


# Print warnings only for each file f in scraper_dir.
def validate(scraper_dir, f)
  fpath = File.join(scraper_dir, f)
  src = File.read(fpath)
  [ FETCH_RE ].each do |re|
    puts "WARN: No match for #{re} in #{f}" if (src !~ re)
  end
end


def add_cacheKey_to_fetch_calls(src)
  original_src = "CLONE: #{src}"

  matches = src.scan(FETCH_RE)
  # puts "add cacheKey: #{matches.inspect}"
  matches.uniq.each do |m|
    raise "bad re? #{m}" if m.size != 3
    before, url, after = m
    wholeline = [before, url, after].join('')
    newline = "#{before}#{url}, 'default'#{after}"
    puts "  + \"#{wholeline}\" => \"#{newline}\""
    src = src.gsub(wholeline, newline)
  end

  src
end


# # Specific hack
# def postmigration_AU_QLD_stuff(src)
#   old = "async function getCurrentArticlePage(obj) {
#   const $ = await fetch.page(this, obj.url);
#   const anchors = $('#content h3:first-of-type > a');
#   const currentArticleUrl = anchors[0].attribs.href;
#   return fetch.page(currentArticleUrl);
# }"
#   new = "async function getCurrentArticlePage(obj) {
#   const $ = await fetch.page(obj, obj.url);
#   const anchors = $('#content h3:first-of-type > a');
#   const currentArticleUrl = anchors[0].attribs.href;
#   return fetch.page(obj, currentArticleUrl);
# }"
#   src = src.gsub(old, new)
#   src
# end


# def post_migration_check(src)
#   matches = src.scan(FETCH_RE)
#   # puts "add this: #{matches.inspect}"
#   matches.each do |m|
#     raise "bad re? #{m}" if m.size != 3
#     wholeline, before, after = m
#     if (after !~ /this, /) then
#       puts "  ??? Missing 'this' in fetch call in \"#{wholeline}\" ???"
#     end
#   end
# end

########################################

scraper_dir = File.join(__dir__, '..', '..', 'src', 'shared', 'scrapers')

files = []
Dir.chdir(scraper_dir) do
  files = Dir.glob(File.join('**', '*.js'))
end
# puts "Pre remove count: #{files.count}"
# files -= IGNORE_FILES
# puts "Post remove count: #{files.count}"
puts "#{files.size} scraper files."


if (!FILENAME.nil?) then
  if (!files.include?(FILENAME)) then
    puts "#{FILENAME} is not in the list of scraper files:"
    puts files.sort.map { |s| "   #{s}" }
    return
  else
    files = [FILENAME]
  end
end

files.sort!

puts "VALIDATION ========================================"
files.each do |f|
  validate(scraper_dir, f)
end
puts "END VALIDATION ===================================="


# During dev, just do one file.
# add_filename_to_scraper_this(scraper_dir, files[0])
# files = [files[0]]
# files = ['DEU/_shared.js']

puts "MUTATION ========================================"
files.each do |f|
  puts
  puts '=' * 50
  puts f
  puts '-' * 50
  fpath = File.join(scraper_dir, f)
  src = File.read(fpath)

  src = add_cacheKey_to_fetch_calls(src)
  
  # post_migration_check(src)
  puts

  case(WRITE)
  when 'save' then
    File.open(fpath, 'w') { |p| p.puts(src) }
  when 'print' then
    puts
    puts "Result:"
    puts "-" * 50
    puts src
    puts "-" * 50
    puts
  when 'mute' then
    puts ''
  end

end
puts "END MUTATION ===================================="
puts
