import { redirect } from "next/navigation";

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = new URLSearchParams(
        Object.entries(await searchParams).flatMap(([k, v]) =>
            Array.isArray(v) ? v.map((val) => [k, val]) : v ? [[k, v]] : []
        )
    ).toString();

    redirect(`/chat${params ? `?${params}` : ""}`);
}
