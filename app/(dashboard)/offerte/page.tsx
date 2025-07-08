// app/(dashboard)/offerte/page.tsx
export default function OffertePage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-40 space-y-6">
    <h1 className="text-2xl font-bold">Generazione Offerta Intelligente</h1>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum nisl eu fringilla luctus.
      Suspendisse ut placerat leo. In nec massa ut leo vestibulum consequat at vel libero. Vestibulum ante
      ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
    </p>
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <h2 className="text-xl font-semibold">Sezione {i + 1}</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi sed metus in lorem fermentum
          accumsan. Aenean dapibus, neque a fringilla tincidunt, orci sapien hendrerit elit, ac pretium leo
          velit sed est. Sed a metus suscipit, dapibus eros in, pharetra leo. Integer ac tincidunt nisi.
          Vestibulum viverra feugiat nunc nec tincidunt. Pellentesque ut risus a elit lobortis tincidunt.
          Donec luctus rutrum libero, et pulvinar nibh egestas nec.
        </p>
        <p>
          Curabitur vel orci vel orci dignissim lacinia. Cras porta luctus nunc, sed pretium est semper
          tincidunt. Suspendisse potenti. Sed condimentum imperdiet ipsum, sed fermentum orci convallis ac.
          Integer accumsan sem sed velit ultricies, ac hendrerit velit lobortis.
        </p>
      </div>
    ))}
  </div>
  
  )
}
