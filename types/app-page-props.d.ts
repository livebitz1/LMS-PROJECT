interface AppPageProps<P = Record<string, string | string[] | undefined>, S = Record<string, string | string[] | undefined>> {
  params: P;
  searchParams: S;
}
