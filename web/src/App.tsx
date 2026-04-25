import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home.tsx";
import { MediaDetail } from "./pages/MediaDetail.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { Movies } from "./pages/Movies.tsx";
import { Music } from "./pages/Music.tsx";
import { Series } from "./pages/Series.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="movies" element={<Movies />} />
            <Route path="music" element={<Music />} />
            <Route path="series" element={<Series />} />
            <Route path="media/:id" element={<MediaDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
