import { Sparkles } from "lucide-react";

export function CtaPhoneGraphic() {
  return (
    <div className="pointer-events-none absolute bottom-[-74px] right-8 hidden w-[340px] lg:block xl:right-14 xl:w-[380px]" aria-hidden="true">
      <div className="relative mx-auto h-[430px] w-[270px] rounded-[2rem] border-[10px] border-[#132033] bg-white shadow-[0_28px_70px_rgba(2,6,23,0.36)] xl:h-[470px] xl:w-[300px]">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-harlo-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-harlo-teal text-white">
              <Sparkles size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-harlo-ink">Harlo</p>
              <p className="text-[11px] font-medium text-harlo-muted">Website assistant</p>
            </div>
          </div>
          <span className="rounded-full bg-harlo-mist px-2.5 py-1 text-[10px] font-bold text-harlo-teal">Online</span>
        </div>

        <div className="space-y-3 px-4 pt-20">
          <div className="ml-auto max-w-[76%] rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-harlo-ink">
            Can you help me pick the right plan?
          </div>
          <div className="max-w-[88%] rounded-xl bg-harlo-teal px-3 py-3 text-xs font-semibold leading-5 text-white">
            Growth fits teams with steady traffic and 4,000 monthly credits.
          </div>
          <div className="ml-auto max-w-[78%] rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-harlo-ink">
            Can someone follow up?
          </div>
          <div className="rounded-xl border border-harlo-line bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-harlo-ink">Lead captured</p>
            <div className="mt-3 space-y-2">
              <span className="block h-2 w-4/5 rounded-full bg-harlo-mist" />
              <span className="block h-2 w-2/3 rounded-full bg-harlo-mist" />
              <span className="block h-2 w-1/2 rounded-full bg-harlo-mist" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
