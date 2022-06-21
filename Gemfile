source "http://rubygems.org"

ruby "2.6.0"

group :development do
  gem "capistrano"
  gem "capistrano-npm"

  # using git config to get commits to master since the rubygems-tagged version 1.0.5
  gem "capistrano-pm2", git: "https://github.com/creative-workflow/capistrano-pm2"

  # These are required for ed25519 ssh keys
  gem "bcrypt_pbkdf"
  gem "ed25519"
end
