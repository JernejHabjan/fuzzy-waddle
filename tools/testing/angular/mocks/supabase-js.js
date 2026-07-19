// Minimal stub of SupabaseClient class
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  // Add stubbed methods your tests use, for example:
  from() {
    return {
      select: () => ({
        then: () => Promise.resolve([]) // dummy select
      })
    };
  }

  // Add more methods as needed
}

// Mock the createClient function to return our stub
function createClient(url, key) {
  return new SupabaseClient(url, key);
}

module.exports = {
  SupabaseClient,
  createClient
};
