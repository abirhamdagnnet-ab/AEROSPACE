export function createPostService(repository) {
  return {
    list: (options) => repository.list(options),
    getBySlug: (slug) => repository.getBySlug(slug),
  }
}
