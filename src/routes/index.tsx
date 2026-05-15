import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CinematicIntro } from "@/components/CinematicIntro";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!done) return;
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/dashboard" : "/auth", replace: true });
    });
  }, [done, navigate]);

  return <CinematicIntro onDone={() => setDone(true)} />;
}
