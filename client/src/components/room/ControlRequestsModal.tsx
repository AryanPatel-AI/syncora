import React from 'react';
import { ApprovalQueue } from './ApprovalQueue';

interface ControlRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlRequestsModal: React.FC<ControlRequestsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <ApprovalQueue onClose={onClose} isInline={false} />;
};
