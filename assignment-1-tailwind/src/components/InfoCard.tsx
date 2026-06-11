export interface InfoCardProps {
    title: string;
    info: string;
}
const InfoCard = ({ title, info }: InfoCardProps) => {
  return (
    <div className="bg-bg-surface border rounded-xl p-4 text-center shadow-sm">
       <h3 className="text-sm opacity-70">{title}</h3>
        <p className="text-xl font-semibold">{info}</p>
    </div>
  );
};

export default InfoCard;