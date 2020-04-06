# Given cacheCalls.txt in this directory, compare the output against the data.


require 'json'

# The cacheCalls file isn't actually valid json: we have to strip off
# a final comma, and put everything in [ ].
# Totally lazy hack.
def get_cachecalls_json()
  raw_content = File.read(File.join(__dir__, 'cacheCalls.txt'))
  actual = "[ #{raw_content} ]".gsub(",\n ]", "\n]")
  return JSON.parse(actual)
end

# Remove cruft from the cacheCalls data.
def clean_output(hsh)
  ret = hsh.clone
  if (ret['scraperPath'].nil?)
    raise hsh.inspect
  end
  ret['scraperPath'].gsub!(/^.*?src/, 'src')
  ret.delete('cacheFileExists')
  return ret
end


j = get_cachecalls_json()

jout =
  j.select { |h| h['cacheFilePath'] =~ /coronadatascraper-cache/ }.
    map { |h| clean_output(h) }
files_returned = jout.map { |h| h['cacheFilePath'] }.uniq.sort

# puts JSON.pretty_generate(jout)

cachedir = File.join(__dir__, '..', '..', 'coronadatascraper-cache')
files = []
Dir.chdir(cachedir) do
  files = Dir.glob(File.join('**', '*.*'))
end
all_files =
  files.
    map { |f| File.join("coronadatascraper-cache", f) }.
    uniq.
    sort

cache_hits = files_returned & all_files
unused_files = all_files - files_returned

puts "The following #{unused_files.size} files were NOT INCLUDED in cacheCalls.txt"
puts
puts unused_files

report = [
  "total files in cache:                           #{files.size}",
  "can be migrated:                                #{cache_hits.size}",
  "still unknown, unused during cache-only scrape:  #{unused_files.size}"
]
puts
report.each { |s| puts "  #{s}" }
