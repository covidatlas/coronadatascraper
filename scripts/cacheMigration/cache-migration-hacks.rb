# Hack all of the scraper files.
#
# USAGE:
#
# - cd into this directory,
# - run `ruby cache-migration-hacks.rb WRITE [FILENAME]`
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
#   ruby cache-migration-hacks.rb print DEU/_shared.js

if (ARGV.size < 1) then
  puts "usage: ruby cache-migration-hacks.rb WRITE [FILENAME]"
  puts "where WRITE = save/print/mute"
  return
end

WRITE = ARGV[0].to_s.downcase
FILENAME = (ARGV.size > 1) ? ARGV[1] : nil

# Skip some files.
# Not bothering to try to determine these programmatically.
IGNORE_FILES = %w(
AUS/_shared/get-data-with-tested-negative-applied.js
AUS/_shared/get-key.js
)


LOCATION_RE = /(\s*)(city|county|state|country):/
METHODS = 'page|raw|json|jsonAndCookies|csv|tsv|pdf|headless|getArcGISCSVURLFromOrgId|getArcGISCSVURL'

# The fancy RE below splits a line like "await fetch.csv(this.url)"
# into ["await fetch.csv(this.url)", "await fetch.csv(", "this.url)"]
FETCH_RE = /((await\s+.*?\.(?:#{METHODS})\s*\()(.*\)))/


# Print warnings only for each file f in scraper_dir.
def validate(scraper_dir, f)
  fpath = File.join(scraper_dir, f)
  src = File.read(fpath)
  [ LOCATION_RE, FETCH_RE ].each do |re|
    puts "WARN: No match for #{re} in #{f}" if (src !~ re)
  end
end


def add_filename_to_scraper_this(src)
  m = src.match(LOCATION_RE)
  # puts "add filename: #{m.inspect}"
  if (m.nil?) then
    puts "  - skipping adding filepath (no match for RE)"
    return src
  end

  if (src =~ /filepath: __filename/)
    puts "  - skipping adding _filepath, already added"
    return src
  end

  spaces = m[1].gsub("\n", '')
  loctype = m[2]
  puts "  + adding filepath above #{loctype}"
  add_code = "
#{spaces}_filepath: __filename,
#{spaces}#{loctype}:"
  src = src.sub(LOCATION_RE, add_code)
  src
end


def add_this_to_fetch_calls(src)
  matches = src.scan(FETCH_RE)
  # puts "add this: #{matches.inspect}"
  matches.each do |m|
    raise "bad re? #{m}" if m.size != 3
    wholeline, before, after = m
    if (after =~ /this, /) then
      puts "  - 'this, ' already in \"#{wholeline}\", skipping"
    else
      newline = "#{before}this, #{after}"
      puts "  + \"#{wholeline}\" => \"#{newline}\""
      src = src.gsub(wholeline, newline)
    end
  end
  src
end

# Specific hack
def postmigration_AU_QLD_stuff(src)
  old = "async function getCurrentArticlePage(obj) {
  const $ = await fetch.page(this, obj.url);
  const anchors = $('#content h3:first-of-type > a');
  const currentArticleUrl = anchors[0].attribs.href;
  return fetch.page(currentArticleUrl);
}"
  new = "async function getCurrentArticlePage(obj) {
  const $ = await fetch.page(obj, obj.url);
  const anchors = $('#content h3:first-of-type > a');
  const currentArticleUrl = anchors[0].attribs.href;
  return fetch.page(obj, currentArticleUrl);
}"
  src = src.gsub(old, new)
  src
end

########################################

scraper_dir = File.join(__dir__, '..', '..', 'src', 'shared', 'scrapers')

files = []
Dir.chdir(scraper_dir) do
  files = Dir.glob(File.join('**', '*.js'))
end
# puts "Pre remove count: #{files.count}"
files -= IGNORE_FILES
# puts "Post remove count: #{files.count}"
puts "#{files.size} scraper files."


if (!FILENAME.nil?) then
  if (!files.include?(FILENAME)) then
    puts "#{FILENAME} is not in the list of scraper files:"
    puts files.map { |s| "   #{s}" }
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
  src = add_filename_to_scraper_this(src)
  src = add_this_to_fetch_calls(src)
  src = postmigration_AU_QLD_stuff(src)
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
