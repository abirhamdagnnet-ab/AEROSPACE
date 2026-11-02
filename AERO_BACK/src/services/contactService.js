export function createContactService(repository) {
  return {
    async create(payload) {
      return repository.create(payload)
    },
  }
}
