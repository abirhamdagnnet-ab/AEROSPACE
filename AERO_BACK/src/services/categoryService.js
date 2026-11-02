export function createCategoryService(repository) {
  return {
    list: () => repository.list(),
  }
}
